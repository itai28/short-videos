"""Render a scene spec (dict) to a vertical 1080x1920 MP4.

Scenes are drawn frame by frame with Pillow and piped into ffmpeg.
Scene types: "text" (stacked lines that pop in, optional count-up number)
and "bars" (a growing bar chart with a running total).
"""
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

_fonts = {}


def font(size, bold=True):
    key = (size, bold)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)
    return _fonts[key]


def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def background(theme):
    top, bottom = hex_rgb(theme["bg_top"]), hex_rgb(theme["bg_bottom"])
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)
    for y in range(H):
        d.line([(0, y), (W, y)], fill=mix(top, bottom, y / H))
    return img


def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# Keep content clear of the TikTok/Shorts overlays: top bar, right-side buttons, bottom caption.
SAFE_LEFT, SAFE_RIGHT, SAFE_TOP, SAFE_BOTTOM = 80, W - 190, 260, H - 420


def draw_clock(d, theme, progress, total):
    """The channel's signature: a stopwatch ring that drains as the video plays."""
    cx, cy, r = (SAFE_LEFT + SAFE_RIGHT) // 2, SAFE_TOP + 60, 60
    accent = hex_rgb(theme["accent"])
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(255, 255, 255, 90), width=10)
    end = -90 + 360 * (1 - progress)
    if end > -90:
        d.arc([cx - r, cy - r, cx + r, cy + r], start=-90, end=end, fill=accent, width=12)
    secs = max(0, round(total * (1 - progress)))
    f = font(44)
    d.text((cx, cy), str(secs), font=f, fill="white", anchor="mm")


def draw_footer(d, theme, spec):
    cx = (SAFE_LEFT + SAFE_RIGHT) // 2
    d.text((cx, SAFE_BOTTOM - 90), spec["handle"], font=font(40), fill=hex_rgb(theme["muted"]), anchor="mm")
    if spec.get("disclaimer"):
        for i, line in enumerate(wrap(d, spec["disclaimer"], font(28, False), SAFE_RIGHT - SAFE_LEFT)):
            d.text((cx, SAFE_BOTTOM - 40 + i * 36), line, font=font(28, False), fill=hex_rgb(theme["muted"]), anchor="mm")


def render_text(d, theme, scene, t):
    lines = scene["lines"]
    blocks = []
    for ln in lines:
        fnt = font(ln.get("size", 90))
        text = ln["text"]
        if "count_to" in ln:
            p = ease_out((t - ln.get("at", 0)) / ln.get("count_dur", 1.2))
            text = text.format(ln.get("prefix", "") + f"{ln['count_to'] * p:,.0f}")
        wrapped = wrap(d, text, fnt, SAFE_RIGHT - SAFE_LEFT)
        blocks.append((ln, fnt, wrapped))
    total_h = sum(len(w) * f.size * 1.2 + 40 for _, f, w in blocks)
    cx = (SAFE_LEFT + SAFE_RIGHT) / 2
    y = (SAFE_TOP + SAFE_BOTTOM) / 2 - total_h / 2
    for ln, fnt, wrapped in blocks:
        appear = ease_out((t - ln.get("at", 0)) / 0.35)
        if appear <= 0:
            y += len(wrapped) * fnt.size * 1.2 + 40
            continue
        color = hex_rgb(theme.get(ln.get("color", "text"), theme["text"]))
        color = mix(hex_rgb(theme["bg_top"]), color, appear)
        offset = (1 - appear) * 60
        for w in wrapped:
            d.text((cx, y + offset + fnt.size * 0.6), w, font=fnt, fill=color, anchor="mm")
            y += fnt.size * 1.2
        y += 40


def render_bars(d, theme, scene, t):
    values = scene["values"]
    labels = scene.get("labels", {})
    top_v = max(values)
    left, right, base, height = SAFE_LEFT + 20, SAFE_RIGHT - 20, SAFE_BOTTOM - 240, 640
    cx = (SAFE_LEFT + SAFE_RIGHT) / 2
    n = len(values)
    gap = 6
    bw = (right - left) / n - gap
    grow = ease_out(t / (scene["dur"] * 0.8))
    shown = values[: max(1, int(n * grow))]
    accent, text = hex_rgb(theme["accent"]), hex_rgb(theme["text"])
    d.text((cx, SAFE_TOP + 190), scene["title"], font=font(52), fill=text, anchor="mm")
    for i, v in enumerate(shown):
        x = left + i * (bw + gap)
        h = height * v / top_v
        d.rectangle([x, base - h, x + bw, base], fill=accent)
        if i in labels:
            d.text((x + bw / 2, base + 50), labels[i], font=font(34), fill=text, anchor="mm")
    current = shown[-1]
    d.text((cx, SAFE_TOP + 320), f"${current:,.0f}", font=font(120), fill=accent, anchor="mm")


RENDERERS = {"text": render_text, "bars": render_bars}


def render(spec, out_path, fps=30):
    theme = spec["theme"]
    bg = background(theme)
    total = sum(s["dur"] for s in spec["scenes"])
    cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", out_path]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    elapsed = 0.0
    for scene in spec["scenes"]:
        frames = int(scene["dur"] * fps)
        for f in range(frames):
            t = f / fps
            img = bg.copy()
            d = ImageDraw.Draw(img)
            RENDERERS[scene["type"]](d, theme, scene, t)
            draw_clock(d, theme, (elapsed + t) / total, total)
            draw_footer(d, theme, spec)
            proc.stdin.write(img.tobytes())
        elapsed += scene["dur"]
    proc.stdin.close()
    proc.wait()
    return total
