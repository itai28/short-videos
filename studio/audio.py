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


def music_bed(seconds, bpm=104, seed=7):
    """Upbeat chiptune-lo-fi loop: pad, sub bass, square-wave arpeggio, four-on-the-floor kick."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    out = np.zeros(n, dtype=np.float32)
    beat = 60 / bpm
    bar = beat * 4
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 67]]
    t_bar = np.arange(int(bar * SR)) / SR
    step = beat / 4
    s_len = int(step * SR)
    ts = np.arange(s_len) / SR
    i = 0
    while i * bar < seconds:
        start = int(i * bar * SR)
        chord = chords[i % len(chords)]
        seg = np.zeros_like(t_bar, dtype=np.float32)
        for m in chord:
            f = note_hz(m)
            seg += 0.5 * np.sin(2 * np.pi * f * t_bar) + 0.12 * np.sin(2 * np.pi * 2 * f * t_bar)
        seg *= _env(len(seg), 0.05, 0.3) * 0.035
        seg += np.sin(2 * np.pi * note_hz(chord[0] - 12) * t_bar) * _env(len(t_bar), 0.01, 0.3) * 0.08
        for k in range(16):      # 16th-note arpeggio
            m = chord[[0, 1, 2, 3, 2, 1, 3, 2][k % 8]] + 12
            sq = np.sign(np.sin(2 * np.pi * note_hz(m) * ts))
            sq = np.convolve(sq, np.ones(5) / 5, mode="same") * np.exp(-ts * 18) * 0.028
            a = k * s_len
            seg[a:a + s_len] += sq[: max(0, min(s_len, len(seg) - a))]
        end = min(n, start + len(seg))
        out[start:end] += seg[: end - start]
        i += 1
    k_len = int(0.3 * SR)
    tk = np.arange(k_len) / SR
    kick = np.sin(2 * np.pi * (48 + 110 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 11) * 0.24
    h_len = int(0.04 * SR)
    hat = np.diff(rng.standard_normal(h_len + 1)).astype(np.float32) * np.exp(-np.arange(h_len) / SR * 110) * 0.018
    c_len = int(0.12 * SR)
    clap = rng.standard_normal(c_len).astype(np.float32) * np.exp(-np.arange(c_len) / SR * 35) * 0.05
    b = 0
    while b * beat < seconds:
        s = int(b * beat * SR)
        if s + k_len < n:
            out[s:s + k_len] += kick
        if b % 2 == 1 and s + c_len < n:
            out[s:s + c_len] += clap
        hs = int((b + 0.5) * beat * SR)
        if hs + h_len < n:
            out[hs:hs + h_len] += hat
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
    raise ValueError(kind)


def place(track, clip, at_seconds, gain=1.0):
    s = int(at_seconds * SR)
    if s < 0:
        clip, s = clip[-s:], 0
    e = min(len(track), s + len(clip))
    if s < e:
        track[s:e] += clip[: e - s] * gain
