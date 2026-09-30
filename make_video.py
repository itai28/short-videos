"""Usage: python3 make_video.py scripts/cents_001_coffee.py"""
import importlib.util
import json
import pathlib
import sys

from studio.render import render

path = pathlib.Path(sys.argv[1])
spec_mod = importlib.util.spec_from_file_location(path.stem, path)
mod = importlib.util.module_from_spec(spec_mod)
spec_mod.loader.exec_module(mod)

out = pathlib.Path("videos") / path.stem.split("_")[0] / f"{path.stem}.mp4"
out.parent.mkdir(parents=True, exist_ok=True)
seconds = render(mod.SPEC, str(out))
meta = {
    "title": mod.TITLE, "caption": mod.CAPTION, "seconds": round(seconds, 1), "file": out.name,
    "ai_label": "Voice is AI-generated (Kokoro TTS); turn on the platform's AI-generated content label.",
    "assets": [
        {"what": "visuals, captions, logo", "source": "rendered by shorts-studio", "license": "own work"},
        {"what": "voiceover", "source": "Kokoro-82M TTS", "license": "Apache-2.0"},
        {"what": "music and sound effects", "source": "synthesized by studio/audio.py", "license": "own work"},
    ],
}
out.with_suffix(".json").write_text(json.dumps(meta, indent=2))
print(out, f"{seconds:.1f}s")
