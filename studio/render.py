"""Render a voiced scene spec to a vertical 1080x1920 MP4.

Each scene has a line of voiceover (`say`) and a visual. The voice decides how
long the scene runs; captions follow the voice word by word. Frames are drawn
with Pillow and piped to ffmpeg, then muxed with the mixed audio track.
"""
import math
import os
import random
import subprocess
import tempfile

import imageio_ffmpeg
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from studio import audio

W, H = 1080, 1920
FPS = 30
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")

# Keep content clear of the TikTok/Shorts overlays: top bar, right-side buttons, bottom caption.
SAFE_LEFT, SAFE_RIGHT, SAFE_TOP, SAFE_BOTTOM = 80, W - 190, 260, H - 420
CX = (SAFE_LEFT + SAFE_RIGHT) // 2
VISUAL_Y = 720            # centre of the visual area
CAPTION_Y = 1300          # centre of the caption line

_fonts = {}


def font(size):
    size = max(8, int(size))
    if size not in _fonts:
        _fonts[size] = ImageFont.truetype(FONT_BOLD, size)
    return _fonts[size]


def clamp(t):
    return max(0.0, min(1.0, t))


def ease_out(t):
    return 1 - (1 - clamp(t)) ** 3


def back_out(t, s=1.9):
    t = clamp(t) - 1
    return t * t * ((s + 1) * t + s) + 1


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


# ---------- background ----------

class Background:
    """Gradient with soft light blobs that drift slowly, so the frame never sits still."""

    def __init__(self, theme):
        top, bottom = rgb(theme["bg_top"]), rgb(theme["bg_bottom"])
        grad = np.linspace(0, 1, H)[:, None, None]
        arr = np.array(top)[None, None, :] * (1 - grad) + np.array(bottom)[None, None, :] * grad
        self.base = Image.fromarray(np.repeat(arr, W, axis=1).astype(np.uint8))
        blob = Image.new("L", (700, 700), 0)
        ImageDraw.Draw(blob).ellipse([230, 230, 470, 470], fill=80)
        self.blob = blob.filter(ImageFilter.GaussianBlur(60))
        self.glow = Image.new("RGB", (700, 700), rgb(theme["accent"]))

    def frame(self, t):
        img = self.base.copy()
        for i, (ax, ay, sp) in enumerate([(0.2, 0.25, 0.13), (0.8, 0.6, 0.09), (0.4, 0.85, 0.11)]):
            x = int(W * ax + 160 * math.sin(t * sp * 2 * math.pi + i)) - 350
            y = int(H * ay + 120 * math.cos(t * sp * 2 * math.pi + i * 2)) - 350
            img.paste(self.glow, (x, y), self.blob)
        return img


# ---------- drawing helpers ----------

def text_center(d, xy, text, size, fill, stroke=0, stroke_fill=(0, 0, 0)):
    d.text(xy, text, font=font(size), fill=fill, anchor="mm", stroke_width=stroke, stroke_fill=stroke_fill)


def pop_text(d, xy, text, size, fill, t, delay=0.0, stroke=6):
    """Text that springs in with a slight overshoot."""
    p = t - delay
    if p <= 0:
        return
    s = back_out(p / 0.35)
    text_center(d, xy, text, size * s, fill, stroke=stroke, stroke_fill=(0, 40, 20))


def draw_cup(img, cx, cy, scale, t):
    d = ImageDraw.Draw(img)
    s = scale
    body = [cx - 120 * s, cy - 90 * s, cx + 120 * s, cy + 150 * s]
    d.rounded_rectangle(body, radius=40 * s, fill=(250, 246, 238))
    d.ellipse([cx + 90 * s, cy - 30 * s, cx + 190 * s, cy + 90 * s], outline=(250, 246, 238), width=int(26 * s))
    d.ellipse([cx - 110 * s, cy - 110 * s, cx + 110 * s, cy - 60 * s], fill=(111, 66, 36))
    d.rounded_rectangle([cx - 120 * s, cy + 10 * s, cx + 120 * s, cy + 60 * s], radius=6, fill=(15, 157, 88))
    for k in range(3):
        x0 = cx - 60 * s + k * 60 * s
        pts = []
        for j in range(12):
            yy = cy - 130 * s - j * 14 * s
            xx = x0 + 14 * s * math.sin(j * 0.8 + t * 5 + k)
            pts.append((xx, yy))
        d.line(pts, fill=(255, 255, 255), width=int(10 * s), joint="curve")


class Coins:
    """A burst of coins that fall when a big number lands."""

    def __init__(self, n=40, seed=3):
        r = random.Random(seed)
        self.parts = [(r.uniform(SAFE_LEFT, SAFE_RIGHT), r.uniform(-900, -60), r.uniform(26, 46), r.uniform(0, 6))
                      for _ in range(n)]

    def draw(self, d, t, cx, cy, color):
        if t < 0 or t > 2.2:
            return
        for x0, y0, r, ph in self.parts:
            x = x0 + 30 * math.sin(ph + t * 3)
            y = y0 + 700 * t + 500 * t * t
            squash = abs(math.cos(ph + t * 8))
            d.ellipse([x - r, y - r * squash, x + r, y + r * squash], fill=color, outline=(190, 130, 0), width=4)


def draw_clock(d, theme, progress, total):
    """The channel's signature: a stopwatch ring that drains as the video plays."""
    cx, cy, r = CX, SAFE_TOP + 50, 46
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255), width=6)
    end = -90 + 360 * (1 - progress)
    if end > -90:
        d.arc([cx - r, cy - r, cx + r, cy + r], start=-90, end=end, fill=rgb(theme["accent"]), width=10)
    text_center(d, (cx, cy), str(max(0, math.ceil(total * (1 - progress)))), 34, (255, 255, 255))


# ---------- captions ----------

def caption_chunks(words, max_chars=16):
    chunks, cur, length = [], [], 0
    for i, w in enumerate(words):
        if cur and length + 1 + len(w) > max_chars:
            chunks.append(cur)
            cur, length = [], 0
        cur.append(i)
        length += len(w) + (1 if length else 0)
        if w[-1] in ".,?!":
            chunks.append(cur)
            cur, length = [], 0
    if cur:
        chunks.append(cur)
    return chunks


def word_times(words, dur):
    """Spread words across the voice clip by length (a close fit for steady narration)."""
    weights = [len(w) + 2 + (6 if w[-1] in ".,?!" else 0) for w in words]
    total = sum(weights)
    starts, acc = [], 0
    for w in weights:
        starts.append(dur * acc / total)
        acc += w
    return starts


def draw_captions(d, theme, words, starts, t):
    if not words or t < 0:
        return
    current = max(i for i, s in enumerate(starts) if s <= t) if t >= starts[0] else 0
    chunk = next(c for c in caption_chunks(words) if current in c)
    size = 76
    f = font(size)
    texts = [words[i].upper() for i in chunk]
    widths = [d.textlength(x, font=f) for x in texts]
    space = d.textlength(" ", font=f)
    total = sum(widths) + space * (len(texts) - 1)
    if total > SAFE_RIGHT - SAFE_LEFT:
        size = int(size * (SAFE_RIGHT - SAFE_LEFT) / total)
        f = font(size)
        widths = [d.textlength(x, font=f) for x in texts]
        space = d.textlength(" ", font=f)
        total = sum(widths) + space * (len(texts) - 1)
    x = CX - total / 2
    for i, txt, w in zip(chunk, texts, widths):
        active = i == current
        color = rgb(theme["accent"]) if active else (255, 255, 255)
        bump = 1.0 + (0.12 * (1 - clamp((t - starts[i]) / 0.18)) if active else 0)
        d.text((x + w / 2, CAPTION_Y), txt, font=font(size * bump), fill=color, anchor="mm",
               stroke_width=8, stroke_fill=(0, 0, 0))
        x += w + space


# ---------- visuals ----------

def visual_hero(img, d, theme, v, t, dur):
    draw_cup(img, CX, VISUAL_Y - 40, 1.0 + 0.03 * math.sin(t * 3), t)
    if "big" in v:
        pop_text(d, (CX, VISUAL_Y + 260), v["big"], 150, rgb(theme["accent"]), t, delay=v.get("big_at", 0.8))


def visual_counter(img, d, theme, v, t, dur):
    run = v.get("run", 1.6)
    start = v.get("start_at", 0.3)
    p = ease_out((t - start) / run)
    value = v["from"] + (v["to"] - v["from"]) * p
    label = v.get("label")
    if label:
        pop_text(d, (CX, VISUAL_Y - 170), label, 64, (255, 255, 255), t, stroke=5)
    landed = t - start - run
    if v.get("coins"):
        v.setdefault("_coins", Coins()).draw(d, landed, CX, VISUAL_Y, rgb(theme["accent"]))
    scale = 1.0 + (0.18 * math.exp(-landed * 6) if landed > 0 else 0)
    text_center(d, (CX, VISUAL_Y + 10), f"${value:,.0f}", 150 * scale, rgb(theme["accent"]),
                stroke=8, stroke_fill=(0, 40, 20))


def visual_stack(img, d, theme, v, t, dur):
    lines = v["lines"]
    gap = 150
    y0 = VISUAL_Y - gap * (len(lines) - 1) / 2
    for i, ln in enumerate(lines):
        at = ln.get("at", i * dur / (len(lines) + 0.5))
        color = rgb(theme["accent"]) if ln.get("accent") else (255, 255, 255)
        pop_text(d, (CX, y0 + i * gap), ln["text"], ln.get("size", 100), color, t, delay=at)


def visual_chart(img, d, theme, v, t, dur):
    values, marks = v["values"], v.get("marks", {})
    top_v = max(values)
    left, right = SAFE_LEFT + 20, SAFE_RIGHT - 20
    base, height = VISUAL_Y + 300, 520
    n = len(values)
    bw = (right - left) / n
    grow = ease_out(t / (dur * 0.85))
    shown = max(1, int(n * grow))
    accent = rgb(theme["accent"])
    for i in range(shown):
        h = height * values[i] / top_v
        x = left + i * bw
        shade = mix((255, 240, 180), accent, i / n)
        d.rounded_rectangle([x + 3, base - h, x + bw - 3, base], radius=6, fill=shade)
    d.line([(left, base + 4), (right, base + 4)], fill=(255, 255, 255), width=4)
    for i, label in marks.items():
        if i < shown:
            x = left + i * bw + bw / 2
            text_center(d, (x, base + 44), label, 34, (255, 255, 255), stroke=3)
    text_center(d, (CX, VISUAL_Y - 300), f"${values[shown - 1]:,.0f}", 120, accent, stroke=8, stroke_fill=(0, 40, 20))


def visual_cta(img, d, theme, v, t, dur):
    logo = v.get("_logo")
    if logo is None:
        src = Image.open(os.path.join(ASSETS, "branding", "cents-in-sixty.png")).convert("RGB")
        mask = Image.new("L", src.size, 0)
        ImageDraw.Draw(mask).ellipse([0, 0, src.size[0], src.size[1]], fill=255)
        v["_logo"] = logo = (src, mask)
    s = back_out(t / 0.45)
    if s > 0.05:
        size = int(360 * s)
        img.paste(logo[0].resize((size, size)), (CX - size // 2, VISUAL_Y - 120 - size // 2),
                  logo[1].resize((size, size)))
    pop_text(d, (CX, VISUAL_Y + 190), v.get("text", "FOLLOW"), 84, rgb(theme["accent"]), t, delay=0.5)


VISUALS = {"hero": visual_hero, "counter": visual_counter, "stack": visual_stack,
           "chart": visual_chart, "cta": visual_cta}


# ---------- main ----------

def build_audio(spec):
    """Voice every scene, then lay voice, music and sound effects on one track."""
    lead, tail = 0.15, spec.get("scene_gap", 0.25)
    clips, t = [], 0.0
    for scene in spec["scenes"]:
        clip = audio.speak(scene["say"], voice=spec.get("voice", "af_heart"), speed=spec.get("speed", 1.08))
        dur = lead + len(clip) / audio.SR + tail
        clips.append((t + lead, clip))
        scene["_start"], scene["_dur"], scene["_voice_dur"] = t, dur, len(clip) / audio.SR
        t += dur
    total = t + 0.6
    track = np.zeros(int(total * audio.SR) + audio.SR, dtype=np.float32)
    music = audio.music_bed(total)
    track[: len(music)] += music * spec.get("music_gain", 0.55)
    for at, clip in clips:
        audio.place(track, clip, at, gain=1.0)
    for scene in spec["scenes"]:
        for kind, offset in scene.get("sfx", []):
            audio.place(track, audio.sfx(kind), scene["_start"] + offset)
    peak = np.max(np.abs(track)) or 1
    return track / peak * 0.9, total


def render(spec, out_path):
    theme = spec["theme"]
    track, total = build_audio(spec)
    bg = Background(theme)
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "a.wav")
        silent = os.path.join(tmp, "v.mp4")
        sf.write(wav, track, audio.SR)
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                 "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264",
                                 "-pix_fmt", "yuv420p", "-crf", "19", silent], stdin=subprocess.PIPE)
        n_frames = int(total * FPS)
        scenes = spec["scenes"]
        for scene in scenes:
            scene["_words"] = scene["say"].split()
            scene["_starts"] = word_times(scene["_words"], scene["_voice_dur"])
        for f in range(n_frames):
            now = f / FPS
            scene = next((s for s in scenes if s["_start"] <= now < s["_start"] + s["_dur"]), scenes[-1])
            t = now - scene["_start"]
            img = bg.frame(now)
            d = ImageDraw.Draw(img)
            VISUALS[scene["visual"]["kind"]](img, d, theme, scene["visual"], t, scene["_dur"])
            draw_captions(d, theme, scene["_words"], scene["_starts"], t - 0.15)
            draw_clock(d, theme, now / total, total)
            text_center(d, (CX, SAFE_BOTTOM - 20), spec["handle"], 36, (255, 255, 255))
            proc.stdin.write(img.tobytes())
        proc.stdin.close()
        proc.wait()
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy",
                        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out_path], check=True)
    return total
