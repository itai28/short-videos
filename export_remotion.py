"""Voice a script and hand it to the Remotion renderer.

Usage: python3 export_remotion.py scripts/cents_007_x.py

Writes remotion/public/<slug>/audio.wav (voice, music and sound effects already mixed) and
remotion/public/<slug>/timeline.json (scene timings, caption word timings, reveal and hit times,
and a per-frame mouth curve for lip-sync). The Remotion composition reads both, so the voice
decides the timing exactly as in the Pillow renderer.
"""
import importlib.util
import json
import pathlib
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
import soundfile as sf

from studio import audio
from studio.render import build_audio, caption_timeline
from studio.studio_scene import mouth_curve

FPS = 60
ROOT = pathlib.Path(__file__).resolve().parent


def load(path):
    spec_mod = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec_mod)
    spec_mod.loader.exec_module(mod)
    return mod


def export(path):
    mod = load(path)
    spec = mod.SPEC
    track, voice, total, hits = build_audio(spec)
    out = ROOT / "remotion" / "public" / path.stem
    out.mkdir(parents=True, exist_ok=True)
    wav = out / "voice_mix.wav"
    sf.write(wav, track, audio.SR)
    # loudness-normalise to -14 LUFS at 48 kHz so Remotion only has to play it
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-loglevel", "error", "-i", str(wav),
                    "-af", "alimiter=limit=0.7:attack=5:release=50,loudnorm=I=-14:TP=-1.5:LRA=11",
                    "-ar", "48000", str(out / "audio.wav")], check=True)
    wav.unlink()
    n_frames = int(total * FPS)
    mouths, shapes = mouth_curve(voice, audio.SR, FPS, n_frames + 1)
    scenes = []
    for sc in spec["scenes"]:
        scenes.append({
            "start": sc["_start"], "dur": sc["_dur"], "lead": sc["_lead"],
            "reveals": sc["_reveals"],
            "words": [{"w": w, "t": t} for w, t in caption_timeline(sc)],
            **{k: v for k, v in sc.items() if not k.startswith("_") and k not in ("say", "sfx")},
            "say": sc["_say"],
        })
    timeline = {
        "slug": path.stem, "fps": FPS, "total": total, "frames": n_frames,
        "title": getattr(mod, "TITLE", ""), "note": spec.get("note"), "style": spec.get("style", {}),
        "hits": hits, "scenes": scenes,
        "mouth": [round(float(x), 3) for x in mouths[:n_frames]],
        "shape": [round(float(x), 3) for x in shapes[:n_frames]],
    }
    (out / "timeline.json").write_text(json.dumps(timeline))
    return out, total


if __name__ == "__main__":
    for p in sys.argv[1:]:
        o, t = export(pathlib.Path(p))
        print(o, f"{t:.1f}s")
