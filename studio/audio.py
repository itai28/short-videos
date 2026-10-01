"""Audio for a video: voiceover (Kokoro, Apache-2.0 model), a generated music bed, and sound effects.

Everything here is synthesized locally, so there is nothing to license.
"""
import os
import re

import numpy as np

SR = 24000
MODEL_DIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/models"))
PAUSE = "⏸"
PAUSE_SECONDS = 0.45
_tts = None


def tts():
    global _tts
    if _tts is None:
        from kokoro_onnx import Kokoro
        _tts = Kokoro(os.path.join(MODEL_DIR, "kokoro-v1.0.onnx"), os.path.join(MODEL_DIR, "voices-v1.0.bin"))
    return _tts


def voice_style(voice):
    """'am_puck' or a blend like 'am_puck*0.6+af_heart*0.4'."""
    if "*" not in voice:
        return voice
    style = None
    for part in voice.split("+"):
        name, weight = part.split("*")
        s = tts().get_voice_style(name.strip()) * float(weight)
        style = s if style is None else style + s
    return style


def trim(x, thresh=0.004):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x[:0]
    return x[max(0, idx[0] - 1200): idx[-1] + 1200]   # keep 50 ms pre-roll so first words survive


def split_phrases(text):
    """Split a line at punctuation and pause marks (not inside numbers like $1,000 or 9.59)."""
    parts = re.findall(r"(?:[^,.?!…⏸]|(?<=\d)[.,](?=\d))+[,.?!…]*|⏸", text)
    return [p.strip() for p in parts if p.strip()]


def speak_line(text, voice, speed):
    """Voice a line phrase by phrase.

    Returns the audio, the (phrase, start, end) timings used to sync captions, and the
    times of any ⏸ reveal pauses.
    """
    style = voice_style(voice)
    chunks, phrases, reveals, t = [], [], [], 0.0
    for p in split_phrases(text):
        if p == PAUSE:
            gap = np.zeros(int(PAUSE_SECONDS * SR), dtype=np.float32)
            chunks.append(gap)
            t += len(gap) / SR
            reveals.append(t)
            continue
        clip = trim(np.asarray(tts().create(p, voice=style, speed=speed, lang="en-us")[0], dtype=np.float32))
        phrases.append((p, t, t + len(clip) / SR))
        chunks.append(clip)
        t += len(clip) / SR
        tail = 0.22 if p[-1] in ".?!…" else 0.09 if p[-1] == "," else 0.03
        chunks.append(np.zeros(int(tail * SR), dtype=np.float32))
        t += tail
    audio = np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)
    return audio, phrases, reveals


def _env(n, attack, release):
    e = np.ones(n, dtype=np.float32)
    a, r = min(n, int(attack * SR)), min(n, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def _kick(n_len=0.3, drop=30, decay=11, gain=0.24):
    m = int(n_len * SR)
    t = np.arange(m) / SR
    return (np.sin(2 * np.pi * (48 + 110 * np.exp(-t * drop)) * t) * np.exp(-t * decay) * gain).astype(np.float32)


def _noise_hit(rng, length, decay, gain, hp=True):
    m = int(length * SR)
    x = rng.standard_normal(m + 1).astype(np.float32)
    x = np.diff(x) if hp else x[:m]
    return x * np.exp(-np.arange(m) / SR * decay) * gain


def _tone(f, length, kind="sine", decay=4.0, gain=0.05, attack=0.005):
    m = int(length * SR)
    t = np.arange(m) / SR
    ph = 2 * np.pi * f * t
    if kind == "square":
        w = np.convolve(np.sign(np.sin(ph)), np.ones(5) / 5, mode="same")
    elif kind == "saw":
        w = 2 * ((f * t) % 1) - 1
        w = np.convolve(w, np.ones(7) / 7, mode="same")
    elif kind == "triangle":
        w = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1
    elif kind == "bell":
        w = np.sin(ph) + 0.5 * np.sin(2.76 * ph) * np.exp(-t * 6) + 0.25 * np.sin(5.4 * ph) * np.exp(-t * 10)
    else:
        w = np.sin(ph)
    env = np.exp(-t * decay) * np.clip(t / attack, 0, 1)
    return (w * env * gain).astype(np.float32)


MUSIC_STYLES = {
    # bpm, chord progression (MIDI), lead wave, lead pattern, drums, pad gain
    "chip": dict(bpm=104, lead="square", pattern=[0, 1, 2, 3, 2, 1, 3, 2], drums="four", pad=0.035, lead_gain=0.028, steps=16),
    "arcade": dict(bpm=150, lead="square", pattern=[0, 2, 1, 3, 0, 2, 3, 1], drums="four", pad=0.02, lead_gain=0.03, steps=8),
    "musicbox": dict(bpm=96, lead="bell", pattern=[0, 2, 3, 2, 1, 3, 2, 1], drums="shaker", pad=0.02, lead_gain=0.05, steps=8),
    "gameshow": dict(bpm=120, lead="saw", pattern=[0, 1, 2, 3, 3, 2, 1, 0], drums="four", pad=0.045, lead_gain=0.018, steps=8),
    "minimal": dict(bpm=88, lead="sine", pattern=[0, 0, 2, 0, 1, 0, 3, 0], drums="sub", pad=0.015, lead_gain=0.02, steps=4),
    "gallery": dict(bpm=70, lead="bell", pattern=[0, 2, 1, 3], drums="none", pad=0.04, lead_gain=0.035, steps=2),
}


def music_bed(seconds, bpm=None, seed=7, style="chip"):
    """Original synthesized music bed in one of a few styles (see MUSIC_STYLES)."""
    cfg = MUSIC_STYLES[style]
    bpm = bpm or cfg["bpm"]
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    out = np.zeros(n, dtype=np.float32)
    beat = 60 / bpm
    bar = beat * 4
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 67]]
    t_bar = np.arange(int(bar * SR)) / SR
    steps = cfg["steps"]
    step = bar / steps
    i = 0
    while i * bar < seconds:
        start = int(i * bar * SR)
        chord = chords[i % len(chords)]
        seg = np.zeros_like(t_bar, dtype=np.float32)
        for m in chord:
            f = note_hz(m)
            seg += 0.5 * np.sin(2 * np.pi * f * t_bar) + 0.12 * np.sin(2 * np.pi * 2 * f * t_bar)
        seg *= _env(len(seg), 0.08, 0.4) * cfg["pad"]
        seg += np.sin(2 * np.pi * note_hz(chord[0] - 12) * t_bar) * _env(len(t_bar), 0.01, 0.3) * 0.07
        for k in range(steps):
            m = chord[cfg["pattern"][k % len(cfg["pattern"])]] + 12
            note = _tone(note_hz(m), step * (2.5 if cfg["lead"] == "bell" else 1), cfg["lead"],
                         decay=3 if cfg["lead"] == "bell" else 14, gain=cfg["lead_gain"])
            a = int(k * step * SR)
            e = min(len(seg), a + len(note))
            seg[a:e] += note[: e - a]
        end = min(n, start + len(seg))
        out[start:end] += seg[: end - start]
        i += 1
    kick = _kick()
    hat = _noise_hit(rng, 0.04, 110, 0.018)
    clap = _noise_hit(rng, 0.12, 35, 0.05, hp=False)
    shaker = _noise_hit(rng, 0.06, 60, 0.012)
    sub = _kick(0.5, 12, 5, 0.2)
    b = 0
    while b * beat < seconds:
        s = int(b * beat * SR)
        hs = int((b + 0.5) * beat * SR)
        drums = cfg["drums"]
        if drums == "four":
            if s + len(kick) < n:
                out[s:s + len(kick)] += kick
            if b % 2 == 1 and s + len(clap) < n:
                out[s:s + len(clap)] += clap
            if hs + len(hat) < n:
                out[hs:hs + len(hat)] += hat
        elif drums == "shaker":
            for q in (0, 0.5):
                qs = int((b + q) * beat * SR)
                if qs + len(shaker) < n:
                    out[qs:qs + len(shaker)] += shaker
        elif drums == "sub":
            if b % 2 == 0 and s + len(sub) < n:
                out[s:s + len(sub)] += sub
            if hs + len(hat) < n:
                out[hs:hs + len(hat)] += hat * 0.6
        b += 1
    out *= _env(n, 0.02, 0.3)
    return out


def duck(music, voice, amount=0.62):
    """Pull the music down while the voice is speaking (fast attack, slow release)."""
    win = int(0.05 * SR)
    level = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, mode="same"))
    target = np.clip(level / (np.percentile(level[level > 1e-4], 30) + 1e-9), 0, 1) if np.any(level > 1e-4) else level
    env = np.zeros_like(target)
    att, rel = 1 - np.exp(-1 / (0.03 * SR)), 1 - np.exp(-1 / (0.4 * SR))
    e = 0.0
    for i, x in enumerate(target):
        e += (x - e) * (att if x > e else rel)
        env[i] = e
    return music * (1 - amount * env)


def sfx(kind, seed=1):
    rng = np.random.default_rng(seed)
    if kind == "pop":
        m = int(0.09 * SR)
        t = np.arange(m) / SR
        return (np.sin(2 * np.pi * (700 + 5000 * t) * t) * np.exp(-t * 45) * 0.16).astype(np.float32)
    if kind == "ding":
        m = int(0.9 * SR)
        t = np.arange(m) / SR
        tone = np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1760 * t) + 0.3 * np.sin(2 * np.pi * 2637 * t)
        return (tone * np.exp(-t * 5) * 0.12).astype(np.float32)
    if kind == "riser":
        m = int(0.6 * SR)
        t = np.arange(m) / SR
        noise = np.convolve(rng.standard_normal(m), np.ones(6) / 6, mode="same")
        f = 200 * (8 ** (t / t[-1]))
        sweep = np.sin(2 * np.pi * np.cumsum(f) / SR)
        return ((noise * 0.5 + sweep * 0.5) * (t / t[-1]) ** 2 * 0.2).astype(np.float32)
    if kind == "boom":
        m = int(0.7 * SR)
        t = np.arange(m) / SR
        return (np.sin(2 * np.pi * (55 + 40 * np.exp(-t * 20)) * t) * np.exp(-t * 5) * 0.45).astype(np.float32)
    if kind == "shimmer":
        m = int(0.8 * SR)
        out = np.zeros(m, dtype=np.float32)
        for k in range(8):
            f, at = rng.uniform(2000, 4000), int(rng.uniform(0, 0.6) * SR)
            ln = int(0.12 * SR)
            t = np.arange(ln) / SR
            seg = np.sin(2 * np.pi * f * t) * np.exp(-t * 30) * 0.05
            out[at:at + ln] += seg[: len(out[at:at + ln])]
        return out
    if kind == "tick":
        m = int(0.04 * SR)
        t = np.arange(m) / SR
        return (np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 120) * 0.15).astype(np.float32)
    if kind == "blip":
        m = int(0.14 * SR)
        t = np.arange(m) / SR
        f = 900 - 600 * t / t[-1]
        return (np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-t * 14) * 0.06).astype(np.float32)
    if kind == "whoosh":
        m = int(0.35 * SR)
        t = np.arange(m) / SR
        noise = np.convolve(rng.standard_normal(m), np.ones(12) / 12, mode="same")
        return (noise * np.sin(np.pi * t / t[-1]) ** 2 * 0.25).astype(np.float32)
    if kind == "thud":
        return _kick(0.25, 40, 18, 0.35)
    if kind == "stamp":
        return (_kick(0.2, 60, 25, 0.3) + np.pad(_noise_hit(rng, 0.08, 50, 0.08, hp=False), (0, int(0.2 * SR) - int(0.08 * SR)))).astype(np.float32)
    if kind == "buzz":
        m = int(0.35 * SR)
        t = np.arange(m) / SR
        return (np.sign(np.sin(2 * np.pi * 110 * t)) * 0.5 * np.exp(-t * 4) * 0.12).astype(np.float32)
    if kind == "kaching":
        a = _tone(1568, 0.5, "bell", 6, 0.08)
        b = _tone(2093, 0.5, "bell", 6, 0.07)
        out = np.zeros(int(0.65 * SR), dtype=np.float32)
        out[: len(a)] += a
        out[int(0.09 * SR): int(0.09 * SR) + len(b)] += b
        return out
    if kind == "chime":
        out = np.zeros(int(0.9 * SR), dtype=np.float32)
        for k, f in enumerate((1047, 1319, 1568)):
            x = _tone(f, 0.6, "bell", 5, 0.05)
            a = int(k * 0.08 * SR)
            out[a:a + len(x)] += x
        return out
    if kind == "swish":
        m = int(0.18 * SR)
        t = np.arange(m) / SR
        noise = np.convolve(rng.standard_normal(m), np.ones(4) / 4, mode="same")
        return (noise * np.sin(np.pi * t / t[-1]) * 0.15).astype(np.float32)
    if kind == "rip":
        m = int(0.5 * SR)
        t = np.arange(m) / SR
        crackle = rng.standard_normal(m) * (rng.random(m) > 0.7)
        return (crackle * np.exp(-t * 3) * 0.09).astype(np.float32)
    if kind == "bass":
        return _kick(0.9, 8, 3, 0.4)
    if kind == "fanfare":
        out = np.zeros(int(0.8 * SR), dtype=np.float32)
        for k, m in enumerate((60, 64, 67, 72)):
            x = _tone(note_hz(m), 0.5, "saw", 5, 0.05)
            a = int(k * 0.1 * SR)
            out[a:a + len(x)] += x
        return out
    if kind == "jingle":
        out = np.zeros(int(0.9 * SR), dtype=np.float32)
        for k, m in enumerate((72, 76, 79, 84)):
            x = _tone(note_hz(m), 0.18, "square", 10, 0.05)
            a = int(k * 0.11 * SR)
            out[a:a + len(x)] += x
        return out
    raise ValueError(kind)


def place(track, clip, at_seconds, gain=1.0):
    s = int(at_seconds * SR)
    if s < 0:
        clip, s = clip[-s:], 0
    e = min(len(track), s + len(clip))
    if s < e:
        track[s:e] += clip[: e - s] * gain
