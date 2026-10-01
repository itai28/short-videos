"""Build a Remotion short end to end: voice + timeline, render, metadata.

Usage:
  python3 make_short.py scripts/cents_007_x.py            # full 1080x1920 render into videos/cents/
  python3 make_short.py scripts/cents_007_x.py --preview   # half-size render + contact sheet for checking

Needs KOKORO_DIR (Kokoro model folder) and, on machines without Remotion's own browser, REMOTION_BROWSER.
"""
import json
import math
import os
import pathlib
import subprocess
import sys

from export_remotion import export, load

ROOT = pathlib.Path(__file__).resolve().parent
BROWSER = os.environ.get("REMOTION_BROWSER") or next(
    (str(p) for p in pathlib.Path("/opt/pw-browsers").glob("chromium_headless_shell-*/*/headless_shell")), "")


def render(slug, out, scale=1.0):
    cmd = ["npx", "remotion", "render", "Short", str(out), f"--props={json.dumps({'slug': slug})}",
           f"--scale={scale}", "--concurrency=2", "--log=error"]
    if BROWSER:
        cmd.append(f"--browser-executable={BROWSER}")
    subprocess.run(cmd, cwd=ROOT / "remotion", check=True)


def contact_sheet(mp4, sheet, every=0.75):
    import imageio_ffmpeg
    from PIL import Image, ImageDraw
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    probe = subprocess.run([ff, "-i", str(mp4)], capture_output=True, text=True).stderr
    dur = 0.0
    for line in probe.splitlines():
        if "Duration:" in line:
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            dur = int(h) * 3600 + int(m) * 60 + float(s)
    tiles, t = [], 0.0
    tmp = sheet.with_suffix(".tmp.png")
    while t < dur:
        subprocess.run([ff, "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", str(mp4), "-frames:v", "1",
                        "-vf", "scale=270:480", str(tmp)], check=True)
        im = Image.open(tmp).convert("RGB")
        ImageDraw.Draw(im).text((6, 6), f"{t:.2f}s", fill=(255, 255, 0))
        tiles.append(im)
        t += every
    tmp.unlink(missing_ok=True)
    out = Image.new("RGB", (270 * 8, 480 * math.ceil(len(tiles) / 8)))
    for k, im in enumerate(tiles):
        out.paste(im, ((k % 8) * 270, (k // 8) * 480))
    out.save(sheet, quality=80)
    return dur


def main():
    path = pathlib.Path(sys.argv[1])
    preview = "--preview" in sys.argv
    mod = load(path)
    slug = path.stem
    _, total = export(path)
    if preview:
        outdir = pathlib.Path(os.environ.get("PREVIEW_DIR", ROOT / "videos" / "preview"))
        outdir.mkdir(parents=True, exist_ok=True)
        mp4 = outdir / f"{slug}.mp4"
        render(slug, mp4, scale=0.5)
        sheet = outdir / f"{slug}.jpg"
        contact_sheet(mp4, sheet)
        print(mp4, sheet, f"{total:.1f}s")
        return
    out = ROOT / "videos" / slug.split("_")[0] / f"{slug}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)
    render(slug, out)
    meta = {
        "title": mod.TITLE, "caption": mod.CAPTION, "seconds": round(total, 1), "file": out.name,
        "ai_label": "Voice is AI-generated (Kokoro TTS); turn on the platform's AI-generated content label.",
        "assets": [
            {"what": "visuals, captions, mascot", "source": "rendered with Remotion from our own code", "license": "own work"},
            {"what": "fonts", "source": "Google Fonts via @fontsource", "license": "SIL Open Font License"},
            {"what": "voiceover", "source": "Kokoro-82M TTS", "license": "Apache-2.0"},
            {"what": "music and sound effects", "source": "synthesized by studio/audio.py", "license": "own work"},
        ],
    }
    out.with_suffix(".json").write_text(json.dumps(meta, indent=2))
    print(out, f"{total:.1f}s")


if __name__ == "__main__":
    main()
