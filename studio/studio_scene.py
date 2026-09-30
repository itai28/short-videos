"""The gamer-studio set and "Centy", the channel's cartoon coin presenter.

Centy is an original character (not based on any real person). His mouth follows the
voiceover, his face switches between five expressions, and his hands react to hits.
"""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1080, 1920
PANEL = (40, 150, 930, 960)          # the "monitor" that holds the visuals
HEAD = (485, 1120, 185)              # centre x, centre y, radius (top overlaps the monitor bezel)
DESK_Y = 1385

GOLD, GOLD_DARK, GOLD_LIGHT = (255, 200, 40), (196, 132, 0), (255, 236, 150)


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def scale_rgb(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


class Studio:
    """Room drawn once. Lights use the video's two theme colours and pulse with the voice."""

    def __init__(self, theme):
        self.c1, self.c2 = rgb(theme["light_a"]), rgb(theme["light_b"])
        grad = np.linspace(0, 1, H)[:, None, None]
        top, bottom = np.array([34, 20, 70]), np.array([8, 5, 20])
        arr = top[None, None, :] * (1 - grad) + bottom[None, None, :] * grad
        room = Image.fromarray(np.repeat(arr, W, axis=1).astype(np.uint8))
        d = ImageDraw.Draw(room)
        for y in (1020, 1190):
            d.rounded_rectangle([0, y, 150, y + 12], radius=4, fill=(58, 40, 96))
            d.rounded_rectangle([905, y, 1080, y + 12], radius=4, fill=(58, 40, 96))
        self.room = room
        self.hexes = [(75, 1100, 0), (990, 1100, 1), (60, 1265, 1), (1000, 1265, 0)]
        x0, y0, x1, y1 = PANEL
        glass = Image.new("RGB", (x1 - x0, y1 - y0), (20, 14, 44))
        gd = ImageDraw.Draw(glass)
        for y in range(0, y1 - y0, 6):
            gd.line([(0, y), (x1 - x0, y)], fill=(27, 21, 52), width=2)
        mask = Image.new("L", glass.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, glass.size[0] - 1, glass.size[1] - 1], radius=40, fill=255)
        self.glass, self.glass_mask = glass, mask
        glow = Image.new("L", (x1 - x0 + 120, y1 - y0 + 120), 0)
        ImageDraw.Draw(glow).rounded_rectangle([60, 60, x1 - x0 + 60, y1 - y0 + 60], radius=40, outline=255, width=26)
        self.glow_mask = glow.filter(ImageFilter.GaussianBlur(24))
        self._glow_levels = {}

    def frame(self, t, pulse):
        img = self.room.copy()
        d = ImageDraw.Draw(img, "RGBA")
        k = 0.55 + 0.45 * pulse
        for x, y, which in self.hexes:
            c = scale_rgb(self.c1 if which == 0 else self.c2, k)
            pts = [(x + 44 * math.cos(math.pi / 3 * i + 0.5), y + 44 * math.sin(math.pi / 3 * i + 0.5)) for i in range(6)]
            d.polygon(pts, fill=c + (190,), outline=(255, 255, 255, 90))
        x0, y0, x1, y1 = PANEL
        rim = scale_rgb(mix(self.c1, self.c2, 0.5 + 0.5 * math.sin(t * 0.8)), 0.7 + 0.3 * pulse)
        level = round(0.5 + 0.5 * pulse, 1)
        if level not in self._glow_levels:
            self._glow_levels[level] = self.glow_mask.point(lambda v: int(v * level))
        img.paste(Image.new("RGB", self.glow_mask.size, rim), (x0 - 60, y0 - 60), self._glow_levels[level])
        img.paste(self.glass, (x0, y0), self.glass_mask)
        d.rounded_rectangle(PANEL, radius=40, outline=rim, width=8)
        return img

    def desk(self, img, t, pulse):
        d = ImageDraw.Draw(img)
        d.rectangle([0, DESK_Y, W, H], fill=(20, 14, 38))
        for x in range(0, W, 12):
            p = 0.5 + 0.5 * math.sin(x / W * 6.28 - t * 2)
            d.rectangle([x, DESK_Y, x + 12, DESK_Y + 8], fill=scale_rgb(mix(self.c1, self.c2, p), 0.6 + 0.4 * pulse))


def _eye(d, ex, ey, expr, look, blink):
    if expr == "hype":
        d.arc([ex - 34, ey - 24, ex + 34, ey + 30], start=200, end=340, fill=(40, 25, 10), width=10)
        return
    if blink:
        d.line([(ex - 34, ey), (ex + 34, ey)], fill=(40, 25, 10), width=9)
        return
    rw, rh = (44, 50) if expr == "shocked" else (38, 44)
    d.ellipse([ex - rw, ey - rh, ex + rw, ey + rh], fill=(255, 255, 255))
    pr = 13 if expr == "shocked" else 19
    d.ellipse([ex - pr + look, ey - pr + 4, ex + pr + look, ey + pr + 4], fill=(30, 20, 10))
    d.ellipse([ex - pr * 0.45 + look, ey - pr * 0.4, ex + look, ey + pr * 0.05], fill=(255, 255, 255))
    if expr == "smug":      # half lids: a knowing look, not a sleepy one
        d.chord([ex - rw - 2, ey - rh - 2, ex + rw + 2, ey + rh + 2], start=200, end=340, fill=GOLD)
        d.line([(ex - rw * 0.8, ey - rh * 0.34), (ex + rw * 0.8, ey - rh * 0.34)], fill=GOLD_DARK, width=6)


def draw_presenter(img, t, mouth, bounce=0.0, shape=0.5, expr="talk", point=0.0):
    """Centy behind the desk.

    mouth: 0..1 voice loudness; shape: 0 round "oo" .. 1 wide "ee";
    expr: talk | shocked | smug | worried | hype; point: 0..1 how far the right hand points at the monitor.
    """
    d = ImageDraw.Draw(img, "RGBA")
    cx, cy, r = HEAD
    cy += 6 * math.sin(t * 2.2) - 16 * bounce
    # hoodie
    d.rounded_rectangle([cx - 230, cy + 140, cx + 230, DESK_Y + 60], radius=110, fill=(124, 58, 237))
    d.rounded_rectangle([cx - 70, cy + 160, cx + 70, cy + 250], radius=34, fill=(98, 40, 200))
    # head: metallic coin with a rim gradient and a highlight streak
    for i in range(12):
        rr = r - i * 2
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=mix(GOLD_LIGHT, GOLD_DARK, i / 11))
    d.ellipse([cx - r + 24, cy - r + 24, cx + r - 24, cy + r - 24], fill=GOLD)
    d.ellipse([cx - r + 30, cy - r + 30, cx + r - 30, cy + r - 30], outline=(240, 176, 20), width=5)
    d.polygon([(cx - 120, cy - 90), (cx - 80, cy - 130), (cx + 10, cy - 40), (cx - 30, cy)], fill=(255, 255, 255, 60))
    # headset
    d.arc([cx - r - 20, cy - r - 34, cx + r + 20, cy + r], start=195, end=345, fill=(28, 28, 38), width=24)
    for sx in (-1, 1):
        ex = cx + sx * (r + 10)
        d.rounded_rectangle([ex - 34, cy - 58, ex + 34, cy + 58], radius=26, fill=(28, 28, 38))
        d.rounded_rectangle([ex - 14, cy - 34, ex + 14, cy + 34], radius=10, fill=(240, 240, 255, 200))
    # mic on the left, clear of the face
    d.line([(20, DESK_Y - 10), (cx - 300, cy + 40), (cx - 190, cy + 110)], fill=(40, 40, 52), width=14, joint="curve")
    d.rounded_rectangle([cx - 230, cy + 80, cx - 160, cy + 170], radius=30, fill=(62, 62, 78), outline=(20, 20, 30), width=4)
    # eyes and brows
    blink = (t % 3.4) < 0.12 and expr not in ("shocked", "hype")
    look = 8 * math.sin(t * 0.9) if expr != "shocked" else 0
    lift = {"shocked": 30, "hype": 12}.get(expr, 6 + 10 * mouth)
    for sx in (-1, 1):
        ex, ey = cx + sx * 68, cy - 30
        _eye(d, ex, ey, expr, look, blink)
        if expr == "worried":
            d.line([(ex - 34 * sx, ey - 58), (ex + 34 * sx, ey - 78)], fill=(120, 70, 0), width=10)
        elif expr == "smug" and sx == 1:
            d.arc([ex - 36, ey - 100, ex + 36, ey - 50], start=200, end=340, fill=(120, 70, 0), width=10)
        elif expr == "smug":
            d.line([(ex - 34, ey - 56), (ex + 34, ey - 56)], fill=(120, 70, 0), width=10)
        else:
            d.arc([ex - 36, ey - 80 - lift, ex + 36, ey - 36 - lift], start=200, end=340, fill=(120, 70, 0), width=10)
    if expr == "worried":
        sy = cy - 110 + (t * 60) % 30
        d.ellipse([cx + 130, sy, cx + 158, sy + 44], fill=(120, 200, 255, 220))
    for sx in (-1, 1):
        d.ellipse([cx + sx * 115 - 26, cy + 22, cx + sx * 115 + 26, cy + 50], fill=(255, 130, 120, 150))
    # mouth follows the voice; shape depends on the sound
    top = cy + 58
    if mouth < 0.12:
        if expr == "hype":
            d.chord([cx - 70, top - 40, cx + 70, top + 60], start=0, end=180, fill=(90, 20, 30))
        elif expr == "smug":
            d.arc([cx - 40, top - 50, cx + 70, top + 14], start=20, end=140, fill=(90, 20, 30), width=10)
        elif expr == "worried":
            d.line([(cx - 44, top), (cx - 15, top - 8), (cx + 15, top + 4), (cx + 44, top - 4)], fill=(90, 20, 30), width=9)
        elif expr == "shocked":
            d.ellipse([cx - 24, top - 10, cx + 24, top + 40], fill=(90, 20, 30))
        else:
            d.arc([cx - 54, top - 48, cx + 54, top + 22], start=20, end=160, fill=(90, 20, 30), width=11)
    else:
        half_w = 30 + 36 * shape
        mo = 16 + 66 * mouth * (1.15 - 0.35 * shape)
        d.ellipse([cx - half_w, top - 8, cx + half_w, top - 8 + mo], fill=(90, 20, 30))
        if mo > 28:
            d.rectangle([cx - half_w * 0.6, top - 6, cx + half_w * 0.6, top + 2], fill=(255, 255, 255))
            d.ellipse([cx - half_w * 0.55, top - 8 + mo * 0.55, cx + half_w * 0.55, top - 8 + mo - 3], fill=(255, 110, 130))
    # hands: gloved, tap on hits; the right one points up at the monitor when a new visual appears
    for sx in (-1, 1):
        hx, hy = cx + sx * 170, DESK_Y - 26 - 22 * bounce
        if sx == 1 and point > 0:
            px, py = hx + 30 * point, hy - 300 * point
            d.line([(cx + 170, cy + 230), (px, py + 30)], fill=(124, 58, 237), width=46)
            hx, hy = px, py
        d.ellipse([hx - 40, hy - 34, hx + 40, hy + 34], fill=(250, 250, 255), outline=(200, 200, 215), width=5)
        if sx == 1 and point > 0.5:
            d.rounded_rectangle([hx - 12, hy - 84, hx + 12, hy - 20], radius=12, fill=(250, 250, 255), outline=(200, 200, 215), width=4)
        else:
            for f in (-22, 0, 22):
                d.ellipse([hx + f - 12, hy - 44, hx + f + 12, hy - 18], fill=(250, 250, 255), outline=(200, 200, 215), width=3)


def mouth_curve(voice, sr, fps, n_frames):
    """Per-frame mouth opening and shape from the voiceover.

    Opening follows loudness in the speech band, with a gate so the mouth shuts
    between words. Shape follows where the energy sits in the spectrum: bright
    sounds ("ee", "s") read wide, dark ones ("oo", "o") read round.
    """
    hop = sr / fps
    win = int(hop * 1.5)
    window = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1 / sr)
    band = (freqs > 250) & (freqs < 4000)
    level = np.zeros(n_frames, dtype=np.float32)
    bright = np.zeros(n_frames, dtype=np.float32)
    for f in range(n_frames):
        c = int(f * hop + hop / 2)
        seg = voice[max(0, c - win // 2): c - win // 2 + win]
        if len(seg) < win:
            continue
        spec = np.abs(np.fft.rfft(seg * window))
        e = spec[band]
        level[f] = np.sqrt(np.mean(e ** 2))
        if e.sum() > 0:
            bright[f] = (freqs[band] * e).sum() / e.sum()
    voiced = level[level > 0]
    if not len(voiced):
        return level, np.full(n_frames, 0.5, dtype=np.float32)
    lo, hi = np.percentile(voiced, 20), np.percentile(voiced, 95)
    opening = np.clip((level - lo) / (hi - lo + 1e-9), 0, 1)
    shape = np.clip((bright - 900) / 1600, 0, 1)
    out = np.copy(opening)
    for f in range(1, n_frames):
        out[f] = opening[f] if opening[f] > out[f - 1] else out[f - 1] * 0.5 + opening[f] * 0.5
    sm = np.copy(shape)
    for f in range(1, n_frames):
        sm[f] = sm[f - 1] * 0.5 + shape[f] * 0.5
    return out, sm
