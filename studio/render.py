"""Render a voiced scene spec to a vertical 1080x1920, 60 fps MP4.

Each scene has a line of voiceover (`say`, with ⏸ marking a dramatic pause before a
reveal) and a visual for the studio monitor. The voice decides how long each scene runs.
Captions follow the voice phrase by phrase. Frames are drawn with Pillow and piped to
ffmpeg, then muxed with the mixed audio track.
"""
import math
import os
import random
import re
import subprocess
import tempfile

import imageio_ffmpeg
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from studio import audio
from studio.studio_scene import DESK_Y, HEAD, PANEL, Studio, draw_presenter, mouth_curve

W, H = 1080, 1920
FPS = 60
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")

# Keep text clear of the TikTok/Shorts overlays: top bar, right-side buttons, bottom caption.
SAFE_LEFT, SAFE_RIGHT = 70, 890
CX = (SAFE_LEFT + SAFE_RIGHT) // 2
VISUAL_Y = 520            # centre of the visual area on the monitor
CAPTION_Y = 1430          # caption line, on the desk front, clear of the bottom UI
GOLD = (255, 204, 51)
WHITE = (255, 255, 255)
DARK = (10, 6, 24)

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


# ---------- text ----------

def fit(d, text, size, room=None):
    room = room or (SAFE_RIGHT - SAFE_LEFT - 40)
    width = d.textlength(text, font=font(size))
    return size * room / width if width > room else size


def text_center(d, xy, text, size, fill, stroke=0, stroke_fill=DARK):
    size = fit(d, text, size)
    d.text(xy, text, font=font(size), fill=fill, anchor="mm", stroke_width=stroke, stroke_fill=stroke_fill)


def glow_text(img, xy, text, size, fill, t=1.0):
    """Big number with a soft glow behind it."""
    d = ImageDraw.Draw(img)
    size = fit(d, text, size)
    f = font(size)
    w = int(d.textlength(text, font=f)) + 80
    h = int(size * 1.4) + 60
    layer = Image.new("L", (w, h), 0)
    ImageDraw.Draw(layer).text((w / 2, h / 2), text, font=f, fill=255, anchor="mm")
    glow = layer.filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(v * 0.55 * t))
    img.paste(Image.new("RGB", (w, h), fill), (int(xy[0] - w / 2), int(xy[1] - h / 2)), glow)
    d.text(xy, text, font=f, fill=fill, anchor="mm", stroke_width=10, stroke_fill=DARK)


def pop(img, xy, text, size, fill, t, delay=0.0, glow=False):
    p = t - delay
    if p <= 0:
        return
    s = back_out(p / 0.3)
    if glow:
        glow_text(img, xy, text, size * s, fill, s)
    else:
        text_center(ImageDraw.Draw(img), xy, text, size * s, fill, stroke=8)


def chip(d, xy, text, color):
    f = font(54)
    w = d.textlength(text, font=f) + 64
    d.rounded_rectangle([xy[0] - w / 2, xy[1] - 42, xy[0] + w / 2, xy[1] + 42], radius=42, fill=color)
    d.text(xy, text, font=f, fill=DARK, anchor="mm")


# ---------- icons ----------

def draw_cup(img, cx, cy, s, t):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([cx - 120 * s, cy - 90 * s, cx + 120 * s, cy + 150 * s], radius=40 * s, fill=(250, 246, 238))
    d.ellipse([cx + 90 * s, cy - 30 * s, cx + 190 * s, cy + 90 * s], outline=(250, 246, 238), width=int(26 * s))
    d.ellipse([cx - 110 * s, cy - 110 * s, cx + 110 * s, cy - 60 * s], fill=(111, 66, 36))
    d.rounded_rectangle([cx - 120 * s, cy + 10 * s, cx + 120 * s, cy + 60 * s], radius=6, fill=(15, 157, 88))
    for k in range(3):
        x0 = cx - 60 * s + k * 60 * s
        pts = [(x0 + 14 * s * math.sin(j * 0.8 + t * 5 + k), cy - 130 * s - j * 14 * s) for j in range(12)]
        d.line(pts, fill=WHITE, width=int(10 * s), joint="curve")


def draw_gamepad(img, cx, cy, s, t):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([cx - 190 * s, cy - 90 * s, cx + 190 * s, cy + 90 * s], radius=90 * s, fill=(70, 70, 90))
    d.rectangle([cx - 100 * s, cy - 20 * s, cx - 40 * s, cy + 20 * s], fill=(230, 230, 240))
    d.rectangle([cx - 90 * s, cy - 30 * s, cx - 50 * s, cy + 30 * s], fill=(230, 230, 240))
    for i, (dx, dy, c) in enumerate([(80, -30, (255, 80, 110)), (120, 0, (80, 200, 255)), (80, 30, (120, 230, 120)), (40, 0, (255, 210, 60))]):
        r = 17 * s * (1.2 if int(t * 4) % 4 == i else 1)
        d.ellipse([cx + dx * s - r, cy + dy * s - r, cx + dx * s + r, cy + dy * s + r], fill=c)


def draw_gift(img, cx, cy, s, t):
    d = ImageDraw.Draw(img)
    wob = 8 * math.sin(t * 6)
    d.rectangle([cx - 150 * s, cy - 40 * s, cx + 150 * s, cy + 150 * s], fill=(255, 90, 120))
    d.rectangle([cx - 165 * s, cy - 95 * s + wob, cx + 165 * s, cy - 40 * s + wob], fill=(255, 120, 150))
    d.rectangle([cx - 22 * s, cy - 95 * s + wob, cx + 22 * s, cy + 150 * s], fill=(255, 215, 70))
    d.ellipse([cx - 90 * s, cy - 165 * s + wob, cx - 5 * s, cy - 95 * s + wob], outline=(255, 215, 70), width=int(18 * s))
    d.ellipse([cx + 5 * s, cy - 165 * s + wob, cx + 90 * s, cy - 95 * s + wob], outline=(255, 215, 70), width=int(18 * s))


def draw_penny(img, cx, cy, s, t):
    d = ImageDraw.Draw(img)
    squash = max(abs(math.cos(t * 3)), 0.08)
    r = 150 * s
    d.ellipse([cx - r * squash, cy - r, cx + r * squash, cy + r], fill=(205, 120, 60), outline=(150, 80, 30), width=10)
    if squash > 0.5:
        text_center(d, (cx, cy), "1¢", 110 * s * squash, (255, 230, 200))


def draw_rocket(img, cx, cy, s, t):
    d = ImageDraw.Draw(img)
    cy += 10 * math.sin(t * 8)
    d.polygon([(cx, cy - 190 * s), (cx - 70 * s, cy - 60 * s), (cx - 70 * s, cy + 100 * s), (cx + 70 * s, cy + 100 * s), (cx + 70 * s, cy - 60 * s)], fill=(235, 235, 245))
    d.ellipse([cx - 35 * s, cy - 60 * s, cx + 35 * s, cy + 10 * s], fill=(80, 200, 255), outline=(60, 60, 80), width=8)
    d.polygon([(cx - 70 * s, cy + 20 * s), (cx - 130 * s, cy + 130 * s), (cx - 70 * s, cy + 100 * s)], fill=(255, 80, 110))
    d.polygon([(cx + 70 * s, cy + 20 * s), (cx + 130 * s, cy + 130 * s), (cx + 70 * s, cy + 100 * s)], fill=(255, 80, 110))
    flame = 60 + 30 * abs(math.sin(t * 20))
    d.polygon([(cx - 45 * s, cy + 100 * s), (cx, cy + (100 + flame) * s), (cx + 45 * s, cy + 100 * s)], fill=(255, 190, 40))


ICONS = {"cup": draw_cup, "gamepad": draw_gamepad, "gift": draw_gift, "penny": draw_penny, "rocket": draw_rocket}


class Coins:
    """Coins that burst out of the monitor's bottom bezel and bounce onto the desk."""

    def __init__(self, n=34, seed=3):
        r = random.Random(seed)
        self.parts = [(r.uniform(PANEL[0] + 60, PANEL[2] - 60), r.uniform(-500, 500), r.uniform(-900, -300),
                       r.uniform(22, 38), r.uniform(0, 6)) for _ in range(n)]

    def draw(self, d, t):
        if t < 0 or t > 2.4:
            return
        floor = DESK_Y - 30
        for x0, vx, vy, r, ph in self.parts:
            x = x0 + vx * t * 0.6
            y = PANEL[3] - 30 + vy * t + 1800 * t * t
            if y > floor:
                y = floor - abs(math.sin(t * 9 + ph)) * 20 * max(0, 1 - t)
            squash = max(abs(math.cos(ph + t * 8)), 0.15)
            r = r * (1 - clamp((t - 2.0) / 0.4))
            d.ellipse([x - r * squash, y - r, x + r * squash, y + r], fill=GOLD, outline=(190, 130, 0), width=4)


# ---------- visuals (drawn on the monitor) ----------

def cash(x, v=None):
    """$5,243 style, or with cents for small amounts like a penny ($0.01)."""
    if v and v.get("unit"):
        return f"{x:,.0f} {v['unit']}"
    return f"${x:,.2f}" if abs(x) < 100 and x != int(x) else f"${x:,.0f}"


def reveal_time(scene, v, key="start_at", default=0.3):
    val = v.get(key, default)
    if val == "reveal":
        return scene["_reveals"][0] if scene["_reveals"] else default
    return val


def visual_hero(img, d, theme, v, t, scene):
    icon_y = VISUAL_Y - (60 if "big" in v else 0)
    ICONS[v.get("icon", "cup")](img, CX, icon_y, 0.8 + 0.03 * math.sin(t * 3), t)
    if "big" in v:
        pop(img, (CX, VISUAL_Y + 250), v["big"], 170, GOLD, t, delay=v.get("big_at", 0.0), glow=True)


def visual_pair(img, d, theme, v, t, scene):
    """Hook card: the small cause and the big result, fully on screen from frame 0.

    It is also the last card, so the end matches the first frame and the video loops.
    """
    shown = t + 1.0
    pop(img, (CX, VISUAL_Y - 170), v["small"], 150, WHITE, shown)
    d.polygon([(CX - 40, VISUAL_Y - 70), (CX + 40, VISUAL_Y - 70), (CX, VISUAL_Y - 10)], fill=rgb(theme["light_a"]))
    s = 1 + 0.04 * math.sin(t * 6)
    glow_text(img, (CX, VISUAL_Y + 110), v["big"], 210 * s, GOLD)
    if v.get("label"):
        chip(d, (CX, VISUAL_Y + 290), v["label"], rgb(theme["light_a"]))


def visual_counter(img, d, theme, v, t, scene):
    start = reveal_time(scene, v)
    run = v.get("run", 0.9)
    p = ease_out((t - start) / run)
    value = v["from"] + (v["to"] - v["from"]) * p
    if v.get("label"):
        chip(d, (CX, VISUAL_Y - 190), v["label"], rgb(theme["light_a"]))
    landed = t - start - run
    if v.get("start_at") == "reveal" and t < start:
        # Nothing true to show yet: hold a pulsing ??? until the boom.
        glow_text(img, (CX, VISUAL_Y + 20), "???", 200 * (1 + 0.06 * math.sin(t * 10)), GOLD, 0.7)
        return
    scale = 1.0 + (0.22 * math.exp(-landed * 7) if landed > 0 else 0)
    glow_text(img, (CX, VISUAL_Y + 20), cash(value, v), 200 * scale, GOLD, 0.4 + 0.6 * p)
    if v.get("sub"):
        pop(img, (CX, VISUAL_Y + 210), v["sub"], 64, WHITE, t, delay=start + run)
    if v.get("coins"):
        scene.setdefault("_coins", Coins()).draw(d, landed)


def visual_stack(img, d, theme, v, t, scene):
    lines = v["lines"]
    gap = v.get("gap", 175)
    y0 = VISUAL_Y - gap * (len(lines) - 1) / 2
    for i, ln in enumerate(lines):
        color = GOLD if ln.get("accent") else WHITE
        size = ln.get("size", 120)
        if ln.get("accent") and t > ln.get("at", 0.0) + 0.4:
            size *= 1 + 0.03 * math.sin(t * 5)
        pop(img, (CX, y0 + i * gap), ln["text"], size, color, t, delay=ln.get("at", 0.0), glow=ln.get("accent", False))


def visual_chart(img, d, theme, v, t, scene):
    values, marks = v["values"], v.get("marks", {})
    top_v = max(values)
    left, right = SAFE_LEFT + 30, SAFE_RIGHT - 30
    base, height = VISUAL_Y + 300, 460
    n = len(values)
    bw = (right - left) / n
    grow = ease_out(t / max(0.6, scene["_dur"] * 0.55))
    shown = max(1, math.ceil(n * grow))
    a = rgb(theme["light_a"])
    for i in range(shown):
        h = height * values[i] / top_v
        x = left + i * bw
        d.rounded_rectangle([x + 3, base - h, x + bw - 3, base], radius=6, fill=mix(a, GOLD, i / n))
    d.line([(left, base + 4), (right, base + 4)], fill=WHITE, width=4)
    for i, label in marks.items():
        if i < shown:
            text_center(d, (left + i * bw + bw / 2, base + 50), label, 54, WHITE, stroke=4)
    glow_text(img, (CX, VISUAL_Y - 225), cash(values[shown - 1], v), 124, GOLD)


def visual_race(img, d, theme, v, t, scene):
    """Two lanes racing: e.g. 1% vs 7%, or start at 15 vs start at 35."""
    lanes = v["lanes"]
    top_v = max(l["to"] for l in lanes)
    start = reveal_time(scene, v, default=0.2)
    run = v.get("run", scene["_dur"] * 0.7)
    p = ease_out((t - start) / run)
    colors = [rgb(theme["light_b"]), GOLD]
    full = SAFE_RIGHT - SAFE_LEFT - 40
    for i, lane in enumerate(lanes):
        y = VISUAL_Y - 200 + i * 340
        text_center(d, (CX, y - 80), lane["label"], 64, WHITE, stroke=4)
        value = lane.get("from", 0) + (lane["to"] - lane.get("from", 0)) * p
        w = max(24, full * value / top_v)
        x0 = SAFE_LEFT + 20
        d.rounded_rectangle([x0, y - 40, x0 + w, y + 60], radius=30, fill=colors[i])
        label = cash(value, v)
        if x0 + w + 30 + d.textlength(label, font=font(72)) < SAFE_RIGHT:
            d.text((x0 + w + 20, y + 10), label, font=font(72), fill=WHITE, anchor="lm", stroke_width=4, stroke_fill=DARK)
        else:
            d.text((x0 + w - 20, y + 10), label, font=font(72), fill=DARK, anchor="rm")
    if v.get("verdict") and p >= 0.999:
        pop(img, (CX, VISUAL_Y + 310), v["verdict"], 120, GOLD, t, delay=start + run, glow=True)


def visual_guess(img, d, theme, v, t, scene):
    """Guess-before-reveal: three options, a lock-in countdown, then the right one lights up."""
    reveal = reveal_time(scene, v, "reveal_at", scene["_dur"] - 0.6)
    text_center(d, (CX, VISUAL_Y - 290), v.get("title", "GUESS!"), 84, WHITE, stroke=5)
    on = t >= reveal
    for i, opt in enumerate(v["options"]):
        y = VISUAL_Y - 130 + i * 165
        right = i == v["answer"]
        p = back_out((t - i * 0.15) / 0.3)
        if p <= 0:
            continue
        fill = GOLD if (on and right) else (50, 40, 80) if on else (64, 52, 110)
        w = 330 * p * (1.08 if (on and right) else 1.0)
        d.rounded_rectangle([CX - w, y - 62, CX + w, y + 62], radius=40, fill=fill,
                            outline=WHITE if not on else (128, 120, 150) if not right else fill, width=4)
        text_center(d, (CX, y), opt, 74 * p, DARK if (on and right) else WHITE if not on else (170, 165, 190))
        if on and not right:
            d.line([(CX - w + 40, y), (CX + w - 40, y)], fill=(255, 90, 110), width=8)
    if not on:
        left = math.ceil(reveal - t)
        if left <= 3:
            beat = back_out(1 - ((reveal - t) % 1.0))
            text_center(d, (CX, VISUAL_Y + 320), str(left), 120 * (0.7 + 0.3 * beat), rgb(theme["light_a"]), stroke=6)


def visual_cta(img, d, theme, v, t, scene):
    logo = scene.get("_logo")
    if logo is None:
        src = Image.open(os.path.join(ASSETS, "branding", "cents-in-sixty.png")).convert("RGB")
        mask = Image.new("L", src.size, 0)
        ImageDraw.Draw(mask).ellipse([0, 0, src.size[0], src.size[1]], fill=255)
        scene["_logo"] = logo = (src, mask)
    s = back_out(t / 0.4)
    if s > 0.05:
        size = int(380 * s)
        img.paste(logo[0].resize((size, size)), (CX - size // 2, VISUAL_Y - 130 - size // 2), logo[1].resize((size, size)))
    pop(img, (CX, VISUAL_Y + 170), v.get("text", "FOLLOW"), 130 * (1 + 0.04 * math.sin(t * 6)), GOLD, t, delay=0.2, glow=True)


VISUALS = {"hero": visual_hero, "pair": visual_pair, "counter": visual_counter, "stack": visual_stack,
           "chart": visual_chart, "race": visual_race, "guess": visual_guess, "cta": visual_cta}


# ---------- captions ----------

NUMBERISH = re.compile(r"[$\d%]")


def caption_timeline(scene):
    """[(word, start)] in scene time, synced per phrase to the real voice timings."""
    spoken = scene["_phrases"]
    shown = [p for p in audio.split_phrases(scene.get("cap", scene["_say"])) if p != audio.PAUSE]
    if not spoken:
        return []
    if len(shown) != len(spoken):
        shown = [" ".join(shown)]
        spoken = [(shown[0], spoken[0][1], spoken[-1][2])]
    out = []
    for text, (_, a, b) in zip(shown, spoken):
        words = text.split()
        weights = [len(w) + 2 for w in words]
        acc = 0
        for w, wt in zip(words, weights):
            out.append((w, scene["_lead"] + a + (b - a) * acc / sum(weights)))
            acc += wt
    return out


def caption_chunks(words, max_chars=12):
    chunks, cur, length = [], [], 0
    for i, (w, _) in enumerate(words):
        wl = len(w) * (1.2 if NUMBERISH.search(w) else 1)
        if cur and (length + 1 + wl > max_chars):
            chunks.append(cur)
            cur, length = [], 0
        cur.append(i)
        length += wl + (1 if length else 0)
        if w[-1] in ".,?!…":
            chunks.append(cur)
            cur, length = [], 0
    if cur:
        chunks.append(cur)
    merged = []
    for c in chunks:     # never leave a lone short word hanging
        prev = merged[-1] if merged else None
        prev_text = " ".join(words[i][0] for i in prev) if prev else ""
        if (prev and len(c) == 1 and len(words[c[0]][0]) <= 6 and len(prev) < 3
                and prev_text[-1] not in ".,?!…" and len(prev_text) + 1 + len(words[c[0]][0]) <= 13):
            merged[-1] = merged[-1] + c
        else:
            merged.append(c)
    return merged


def draw_captions(img, timeline, chunks, t):
    if not timeline or t < timeline[0][1] - 0.05:
        return
    current = max(i for i, (_, s) in enumerate(timeline) if s <= t + 0.05)
    chunk = next(c for c in chunks if current in c)
    d = ImageDraw.Draw(img)
    appear = timeline[chunk[0]][1]
    size = 104 * (0.85 + 0.15 * ease_out((t - appear) / 0.08))
    texts = [timeline[i][0].upper() for i in chunk]
    sizes = [size * (1.2 if NUMBERISH.search(x) else 1.0) for x in texts]
    widths = [d.textlength(x, font=font(s)) for x, s in zip(texts, sizes)]
    space = d.textlength(" ", font=font(size))
    total = sum(widths) + space * (len(texts) - 1)
    room = SAFE_RIGHT - SAFE_LEFT
    if total > room:
        k = room / total
        sizes = [s * k for s in sizes]
        widths = [w * k for w in widths]
        space *= k
        total = room
    x = CX - total / 2
    for i, txt, s, w in zip(chunk, texts, sizes, widths):
        color = GOLD if (i == current or NUMBERISH.search(txt)) else WHITE
        d.text((x + w / 2 + 5, CAPTION_Y + 7), txt, font=font(s), fill=(0, 0, 0), anchor="mm", stroke_width=12, stroke_fill=(0, 0, 0))
        d.text((x + w / 2, CAPTION_Y), txt, font=font(s), fill=color, anchor="mm", stroke_width=12, stroke_fill=(0, 0, 0))
        x += w + space


# ---------- camera ----------

def camera(img, scene_t, scene_dur, now, hits):
    """Slow push-in across each scene, plus a punch and shake on every hit."""
    s = 1.0 + 0.045 * clamp(scene_t / max(scene_dur, 0.1))
    dx = dy = 0.0
    for h in hits:
        dt = now - h
        if 0 <= dt < 0.25:
            k = math.exp(-dt * 18)
            s += 0.04 * k
            dx += 7 * k * math.sin(dt * 90)
            dy += 5 * k * math.cos(dt * 110)
    if s <= 1.0005 and abs(dx) < 0.5 and abs(dy) < 0.5:
        return img
    cw, ch = W / s, H / s
    x0 = (W - cw) / 2 + dx
    y0 = (H - ch) * 0.45 + dy
    return img.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))


def flash(img, now, reveals):
    for r in reveals:
        if 0 <= now - r < 0.07:
            x0, y0, x1, y1 = PANEL
            region = img.crop((x0, y0, x1, y1))
            img.paste(Image.blend(region, Image.new("RGB", region.size, WHITE), 0.35), (x0, y0))


def speed_lines(img, k):
    d = ImageDraw.Draw(img, "RGBA")
    cx, cy = HEAD[0], HEAD[1]
    for i in range(24):
        a = i / 24 * 2 * math.pi
        r0, r1, w = 260, 1400, 0.035
        d.polygon([(cx + r0 * math.cos(a), cy + r0 * math.sin(a)),
                   (cx + r1 * math.cos(a - w), cy + r1 * math.sin(a - w)),
                   (cx + r1 * math.cos(a + w), cy + r1 * math.sin(a + w))], fill=(255, 255, 255, int(70 * k)))


# ---------- main ----------

LEAD, GAP = 0.05, 0.08


def build_audio(spec):
    """Voice every scene, then lay voice, music and sound effects on one track."""
    t = 0.0
    voice_default, speed_default = spec.get("voice", "af_heart"), spec.get("speed", 1.1)
    clips = []
    for scene in spec["scenes"]:
        scene["_blip"] = "⚡" in scene["say"]
        scene["_say"] = scene["say"].replace("⚡", "").strip()
        clip, phrases, reveals = audio.speak_line(scene["_say"], scene.get("voice", voice_default),
                                                  scene.get("speed", speed_default))
        scene["_lead"] = LEAD
        scene["_phrases"] = phrases
        scene["_reveals"] = [LEAD + r for r in reveals]
        scene["_start"] = t
        scene["_dur"] = LEAD + len(clip) / audio.SR + GAP + scene.get("hold", 0.0)
        clips.append((t + LEAD, clip))
        t += scene["_dur"]
    total = t + 0.1
    n = int(total * audio.SR) + audio.SR // 2
    voice = np.zeros(n, dtype=np.float32)
    for at, clip in clips:
        audio.place(voice, clip, at)
    mcfg = spec.get("music", {})
    music = audio.duck(audio.music_bed(n / audio.SR, style=mcfg.get("style", "chip"), bpm=mcfg.get("bpm"))[:n], voice)
    fx = np.zeros(n, dtype=np.float32)
    hits = []
    for scene in spec["scenes"]:
        s0 = scene["_start"]
        if scene["_blip"]:
            audio.place(fx, audio.sfx("blip"), s0)
        for kind, offset in scene.get("sfx", []):
            audio.place(fx, audio.sfx(kind), s0 + offset)
            if kind in ("pop", "ding", "boom", "stamp", "thud"):
                hits.append(s0 + offset)
        for r in scene["_reveals"]:
            at = s0 + r
            audio.place(fx, audio.sfx("riser"), at - 0.6)
            audio.place(fx, audio.sfx("boom"), at - 0.03)
            for kind in ("ding", "shimmer"):     # quieter, so they don't mask the revealed number
                audio.place(fx, audio.sfx(kind), at, gain=0.4)
            a, b = int((at - audio.PAUSE_SECONDS) * audio.SR), int(at * audio.SR)
            music[a:b] *= 0.05              # drop the beat out for the pause
            hits.append(at)
        if scene["visual"]["kind"] == "guess":
            reveal = scene["_reveals"][0] if scene["_reveals"] else scene["_dur"] - 0.6
            for k in range(3):
                audio.place(fx, audio.sfx("tick"), s0 + reveal - 1.5 + k * 0.5)
        elif scene["visual"].get("mode") == "guess" or scene["visual"].get("ticks"):
            hold = scene.get("hold", 1.5)    # Remotion guess beats count 3-2-1 across the hold
            for k in range(3):
                audio.place(fx, audio.sfx("tick"), s0 + scene["_dur"] - hold + k * hold / 3)
    track = voice + music * mcfg.get("gain", spec.get("music_gain", 0.6)) + fx * 0.8
    peak = np.max(np.abs(track)) or 1
    return track / peak * 0.9, voice, total, sorted(hits)


def render(spec, out_path):
    theme = spec["theme"]
    track, voice, total, hits = build_audio(spec)
    studio = Studio(theme)
    n_frames = int(total * FPS)
    mouths, shapes = mouth_curve(voice, audio.SR, FPS, n_frames + 1)
    pulse = np.convolve(mouths, np.ones(9) / 9, mode="same")
    scenes = spec["scenes"]
    for sc in scenes:
        sc["_timeline"] = caption_timeline(sc)
        sc["_chunks"] = caption_chunks(sc["_timeline"])
    reveals_abs = [sc["_start"] + r for sc in scenes for r in sc["_reveals"]]
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "a.wav")
        silent = os.path.join(tmp, "v.mp4")
        sf.write(wav, track, audio.SR)
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        proc = subprocess.Popen([ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                                 "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264",
                                 "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "fast", silent], stdin=subprocess.PIPE)
        for f in range(n_frames):
            now = f / FPS
            scene = next((s for s in scenes if s["_start"] <= now < s["_start"] + s["_dur"]), scenes[-1])
            t = now - scene["_start"]
            pl = float(pulse[f])
            img = studio.frame(now, pl)
            d = ImageDraw.Draw(img)
            VISUALS[scene["visual"]["kind"]](img, d, theme, scene["visual"], t, scene)
            note = scene.get("note")
            if note:   # the assumption behind the numbers stays on screen while they are shown
                text_center(d, (CX, PANEL[1] + 40), note if isinstance(note, str) else spec["note"], 32,
                            (200, 200, 225), stroke=3)
            flash(img, now, reveals_abs)
            bounce = max([math.exp(-(now - h) * 9) for h in hits if 0 <= now - h < 0.6] or [0])
            point = 0.0
            if scene["visual"]["kind"] in ("chart", "counter", "race", "guess", "stack"):
                point = clamp(t / 0.2) * clamp((1.0 - t) / 0.25)
            expr = scene.get("expr", "talk")
            if any(0 <= now - r < 1.2 for r in reveals_abs):
                expr = scene.get("reveal_expr", "shocked")
            if scene.get("lean") and t < 0.8:
                # Draw Centy on an opaque copy for colour and on a clear layer for the shape,
                # so his translucent highlights don't punch holes when he is scaled up.
                solid = img.copy()
                draw_presenter(solid, now, float(mouths[f]), bounce, float(shapes[f]), expr, 0)
                layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
                draw_presenter(layer, now, float(mouths[f]), bounce, float(shapes[f]), expr, 0)
                shape = layer.getchannel("A").point(lambda a: 255 if a > 8 else 0)
                k = math.sin(math.pi * clamp(t / 0.8))
                sc_ = 1 + 0.35 * k
                speed_lines(img, k)
                size = (int(W * sc_), int(H * sc_))
                big, big_mask = solid.resize(size, Image.BILINEAR), shape.resize(size, Image.BILINEAR)
                studio.desk(img, now, pl)
                img.paste(big, (int(HEAD[0] - HEAD[0] * sc_), int(HEAD[1] - HEAD[1] * sc_)), big_mask)
            else:
                draw_presenter(img, now, float(mouths[f]), bounce, float(shapes[f]), expr, point)
                studio.desk(img, now, pl)
            img = camera(img, t, scene["_dur"], now, hits)
            draw_captions(img, scene["_timeline"], scene["_chunks"], t)
            proc.stdin.write(img.tobytes())
        proc.stdin.close()
        proc.wait()
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", silent, "-i", wav, "-c:v", "copy",
                        "-af", "alimiter=limit=0.7:attack=5:release=50,loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k",
                        "-shortest", "-movflags", "+faststart", out_path], check=True)
    return total
