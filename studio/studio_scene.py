"""The gamer-studio set and "Centy", the channel's cartoon coin presenter.

Centy is an original character (not based on any real person). The mouth is
driven by the loudness of the voiceover, so the lip-sync follows the audio.
"""
import colorsys
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920
PANEL = (70, 280, 900, 990)          # the RGB "monitor" that holds the visuals
HEAD = (485, 1170, 150)              # centre x, centre y, radius
DESK_Y = 1385


def hue(h, s=0.85, v=1.0):
    r, g, b = colorsys.hsv_to_rgb(h % 1.0, s, v)
    return int(r * 255), int(g * 255), int(b * 255)


def _glow(size, radius, color, blur):
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([blur, blur, size[0] - blur, size[1] - blur], radius=radius, fill=color)
    return im.filter(ImageFilter.GaussianBlur(blur / 2))


class Studio:
    """Static room drawn once; the lights are animated per frame."""

    def __init__(self):
        grad = np.linspace(0, 1, H)[:, None, None]
        top, bottom = np.array([40, 22, 78]), np.array([10, 6, 24])
        arr = top[None, None, :] * (1 - grad) + bottom[None, None, :] * grad
        room = Image.fromarray(np.repeat(arr, W, axis=1).astype(np.uint8))
        d = ImageDraw.Draw(room)
        # shelves with little collectibles
        for y in (1040, 1200):
            d.rounded_rectangle([10, y, 200, y + 14], radius=4, fill=(60, 40, 100))
            d.rounded_rectangle([860, y, 1070, y + 14], radius=4, fill=(60, 40, 100))
        for x, y, c in [(40, 1000, (255, 90, 120)), (110, 990, (80, 200, 255)), (900, 1160, (255, 210, 60)),
                        (980, 1150, (140, 255, 150)), (60, 1160, (190, 120, 255)), (950, 1000, (255, 140, 60))]:
            d.rounded_rectangle([x, y, x + 50, y + 40], radius=10, fill=c)
        self.room = room
        self.hexes = [(150, 1110), (930, 1080), (80, 1290), (1000, 1280)]

    def frame(self, t):
        img = self.room.copy()
        d = ImageDraw.Draw(img, "RGBA")
        for i, (x, y) in enumerate(self.hexes):
            c = hue(t * 0.08 + i * 0.25)
            pts = [(x + 46 * math.cos(math.pi / 3 * k), y + 46 * math.sin(math.pi / 3 * k)) for k in range(6)]
            d.polygon(pts, fill=c + (170,), outline=(255, 255, 255, 120))
        # monitor with an RGB rim
        x0, y0, x1, y1 = PANEL
        rim = hue(t * 0.12)
        glow = _glow((x1 - x0 + 80, y1 - y0 + 80), 50, rim + (150,), 40)
        img.paste(glow, (x0 - 40, y0 - 40), glow)
        d.rounded_rectangle(PANEL, radius=36, fill=(14, 10, 32, 255), outline=rim + (255,), width=8)
        return img


def draw_presenter(img, t, mouth, bounce=0.0):
    """Centy behind the desk. `mouth` is 0..1 (voice loudness)."""
    d = ImageDraw.Draw(img, "RGBA")
    cx, cy, r = HEAD
    cy += 6 * math.sin(t * 2.2) - 18 * bounce
    # hoodie
    d.rounded_rectangle([cx - 200, cy + 110, cx + 200, DESK_Y + 40], radius=90, fill=(124, 58, 237))
    d.rounded_rectangle([cx - 60, cy + 130, cx + 60, cy + 210], radius=30, fill=(98, 40, 200))
    # head: a gold coin
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 205, 50), outline=(214, 150, 0), width=12)
    d.ellipse([cx - r + 26, cy - r + 26, cx + r - 26, cy + r - 26], outline=(240, 180, 20), width=5)
    # headset
    d.arc([cx - r - 18, cy - r - 30, cx + r + 18, cy + r], start=195, end=345, fill=(30, 30, 40), width=22)
    led = hue(t * 0.2)
    for sx in (-1, 1):
        ex = cx + sx * (r + 8)
        d.rounded_rectangle([ex - 30, cy - 50, ex + 30, cy + 50], radius=22, fill=(30, 30, 40))
        d.rounded_rectangle([ex - 14, cy - 30, ex + 14, cy + 30], radius=10, fill=led)
    # eyes: blink every few seconds, pupils drift
    blink = (t % 3.4) < 0.12
    look = 8 * math.sin(t * 0.9)
    brow = 10 + 14 * mouth
    for sx in (-1, 1):
        ex, ey = cx + sx * 55, cy - 30
        if blink:
            d.line([(ex - 32, ey), (ex + 32, ey)], fill=(40, 25, 10), width=8)
        else:
            d.ellipse([ex - 36, ey - 40, ex + 36, ey + 40], fill=(255, 255, 255))
            d.ellipse([ex - 17 + look, ey - 14, ex + 17 + look, ey + 20], fill=(30, 20, 10))
            d.ellipse([ex - 8 + look, ey - 8, ex + 1 + look, ey + 1], fill=(255, 255, 255))
        d.arc([ex - 34, ey - 70 - brow, ex + 34, ey - 30 - brow], start=200, end=340, fill=(120, 70, 0), width=9)
    # cheeks
    for sx in (-1, 1):
        d.ellipse([cx + sx * 95 - 22, cy + 18, cx + sx * 95 + 22, cy + 42], fill=(255, 130, 120, 140))
    # mouth follows the voice
    mo = 6 + 52 * mouth
    if mouth < 0.12:
        d.arc([cx - 46, cy + 10, cx + 46, cy + 72], start=20, end=160, fill=(90, 20, 30), width=10)
    else:
        d.rounded_rectangle([cx - 44, cy + 50, cx + 44, cy + 50 + mo], radius=int(min(30, mo / 2 + 4)), fill=(90, 20, 30))
    if mouth >= 0.12 and mo > 24:
        d.ellipse([cx - 22, cy + 50 + mo - 20, cx + 22, cy + 50 + mo - 2], fill=(255, 110, 130))
    # mic on a boom arm
    d.line([(W - 60, DESK_Y - 10), (cx + 250, cy + 60), (cx + 150, cy + 95)], fill=(40, 40, 50), width=14, joint="curve")
    d.rounded_rectangle([cx + 110, cy + 60, cx + 175, cy + 150], radius=30, fill=(60, 60, 75), outline=(20, 20, 30), width=4)
    # desk with LED strip
    d.rectangle([0, DESK_Y, W, H], fill=(22, 16, 40))
    for x in range(0, W, 12):
        d.rectangle([x, DESK_Y, x + 12, DESK_Y + 8], fill=hue(t * 0.25 + x / W))
    # hands tap the desk on sound effects
    for sx in (-1, 1):
        hx = cx + sx * 150
        hy = DESK_Y - 20 - 14 * bounce
        d.ellipse([hx - 36, hy - 30, hx + 36, hy + 30], fill=(255, 205, 50), outline=(214, 150, 0), width=6)


def mouth_curve(voice, sr, fps, n_frames):
    """Per-frame mouth opening from the voice track's loudness."""
    hop = sr / fps
    out = np.zeros(n_frames, dtype=np.float32)
    for f in range(n_frames):
        seg = voice[int(f * hop): int((f + 1) * hop)]
        if len(seg):
            out[f] = np.sqrt(np.mean(seg ** 2))
    peak = np.percentile(out[out > 0], 95) if np.any(out > 0) else 1
    out = np.clip(out / peak, 0, 1)
    smooth = np.copy(out)
    for f in range(1, n_frames):
        smooth[f] = max(out[f], smooth[f - 1] * 0.55)
    return smooth
