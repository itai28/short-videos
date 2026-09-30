"""Audio for a video: voiceover (Kokoro, Apache-2.0 model), a generated music bed, and sound effects.

Everything here is synthesized locally, so there is nothing to license.
"""
import os

import numpy as np

SR = 24000
MODEL_DIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/models"))
_tts = None


def tts():
    global _tts
    if _tts is None:
        from kokoro_onnx import Kokoro
        _tts = Kokoro(os.path.join(MODEL_DIR, "kokoro-v1.0.onnx"), os.path.join(MODEL_DIR, "voices-v1.0.bin"))
    return _tts


def speak(text, voice="af_heart", speed=1.08):
    samples, sr = tts().create(text, voice=voice, speed=speed, lang="en-us")
    assert sr == SR
    return trim(np.asarray(samples, dtype=np.float32))


def trim(x, thresh=0.01):
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    return x[max(0, idx[0] - 600): idx[-1] + 2400]


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


def music_bed(seconds, bpm=88, seed=7):
    """A soft lo-fi loop: warm chord pad, sub bass, gentle kick and hats."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    out = np.zeros(n, dtype=np.float32)
    beat = 60 / bpm
    bar = beat * 4
    # Am7, Fmaj7, Cmaj7, G6 voiced around middle C
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 59, 64], [55, 59, 62, 64]]
    t_bar = np.arange(int(bar * SR)) / SR
    i = 0
    while i * bar < seconds:
        start = int(i * bar * SR)
        chord = chords[i % len(chords)]
        seg = np.zeros_like(t_bar, dtype=np.float32)
        for m in chord:
            f = note_hz(m)
            seg += 0.5 * np.sin(2 * np.pi * f * t_bar) + 0.15 * np.sin(2 * np.pi * 2 * f * t_bar + 0.3)
        seg *= _env(len(seg), 0.6, 0.8) * 0.05
        bass = np.sin(2 * np.pi * note_hz(chord[0] - 12) * t_bar) * _env(len(t_bar), 0.02, 0.5) * 0.09
        seg += bass
        end = min(n, start + len(seg))
        out[start:end] += seg[: end - start]
        i += 1
    # drums
    k_len = int(0.35 * SR)
    tk = np.arange(k_len) / SR
    kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tk * 25)) * tk) * np.exp(-tk * 9) * 0.22
    h_len = int(0.05 * SR)
    hat = np.diff(rng.standard_normal(h_len + 1)).astype(np.float32) * np.exp(-np.arange(h_len) / SR * 90) * 0.02
    b = 0
    while b * beat < seconds:
        s = int(b * beat * SR)
        if b % 2 == 0 and s + k_len < n:
            out[s:s + k_len] += kick
        hs = int((b + 0.5) * beat * SR)
        if hs + h_len < n:
            out[hs:hs + h_len] += hat
        b += 1
    out *= _env(n, 1.0, 2.0)
    return out


def sfx(kind):
    if kind == "whoosh":
        m = int(0.4 * SR)
        noise = np.random.default_rng(1).standard_normal(m).astype(np.float32)
        smooth = np.convolve(noise, np.ones(12) / 12, mode="same")
        env = np.sin(np.linspace(0, np.pi, m)) ** 2
        return smooth * env * 0.25
    if kind == "pop":
        m = int(0.09 * SR)
        t = np.arange(m) / SR
        return (np.sin(2 * np.pi * (700 + 5000 * t) * t) * np.exp(-t * 45) * 0.25).astype(np.float32)
    if kind == "ding":
        m = int(0.9 * SR)
        t = np.arange(m) / SR
        tone = np.sin(2 * np.pi * 1318.5 * t) + 0.6 * np.sin(2 * np.pi * 1760 * t) + 0.3 * np.sin(2 * np.pi * 2637 * t)
        return (tone * np.exp(-t * 5) * 0.12).astype(np.float32)
    raise ValueError(kind)


def place(track, clip, at_seconds, gain=1.0):
    s = int(at_seconds * SR)
    e = min(len(track), s + len(clip))
    if s < e:
        track[s:e] += clip[: e - s] * gain
