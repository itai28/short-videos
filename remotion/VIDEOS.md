# Building a Cents in Sixty short in Remotion

The voice decides the timing. Python writes the voice track and a timeline; Remotion draws on top of it.

```
scripts/<slug>.py  --python3 make_short.py-->  remotion/public/<slug>/{audio.wav,timeline.json}  --npx remotion render-->  mp4
```

Reference video: `scripts/cents_011_pizza_math.py` + `src/videos/cents_011_pizza_math/`.

## 1. The script (`scripts/<slug>.py`)

Exports `TITLE`, `CAPTION` and `SPEC`:

- `SPEC = {**CENTS_IN_SIXTY, "music": {...}, "style": {...}, "note": "...", "scenes": [...]}`
- `music`: `{"style": chip|arcade|musicbox|gameshow|minimal|gallery, "bpm": int, "gain": 0.4-0.6}`.
- `style` (all optional, passed to Remotion as `timeline.style`):
  - `camera: "none"` turns off the default slow push and hit punches.
  - `background: "none"` turns off the default coin-grid background (draw your own).
  - `flash: false` turns off the white flash on reveals.
  - `sceneEnter: "none"` turns off the fade/scale scene enter.
  - `captionY`: caption top in px (default 1240). Captions span x 70-890.
  - `theme`: `{bg1, bg2, accent, pop, danger, ink, panel}`. `accent` colors numbers in captions.
- Each scene:
  - `say`: what the voice reads. Spell numbers as words when Kokoro might misread them ("fourteen point seven").
    `⏸` = 0.45 s dramatic pause; the moment after it is a *reveal* (riser + boom + ding are added automatically).
    `⚡` = a blip sound at scene start. Phrases split on `, . ? ! …`.
  - `cap`: optional caption text with digits ("14.7"). Must have the same phrase punctuation as `say`
    so word timings line up. The exporter prints a WARNING when the phrase counts differ; fix every one.
  - `visual`: `{"kind": "<prefix>.<name>", ...any props}`. Kinds are prefixed per video (`pizza.area`).
    `mode: "guess"` (or `ticks: True`) adds three countdown ticks across the scene's `hold`.
  - `hold`: extra silent seconds at the end of the scene (guess beats).
  - `speed`: per-scene voice speed (channel default 1.18).
  - `sfx`: `[(kind, seconds_into_scene), ...]`. Kinds: pop, ding, riser, boom, shimmer, tick, blip, whoosh,
    thud, stamp, buzz, kaching, chime, swish, rip, bass, fanfare, jingle.
  - `note`: `True` (shows SPEC["note"]) or a string. Drawn small at y 160 for assumptions ("assumes equal odds").

## 2. The visuals (`src/videos/<slug>/index.tsx`)

Export `visuals: VisualMap` mapping each `kind` to a component with props `{scene, theme, timeline, index}`.
Each component renders inside a `<Sequence>` for its scene, so `useCurrentFrame()` is scene-relative.

- `scene.dur`, `scene.reveals` (seconds into the scene), `scene.words` (`[{w, t}]`, caption words with
  seconds into the scene), `scene.visual` (your props).
- `src/visuals/util.ts`: `useT()` (scene seconds), `popIn(t, at, dur)`, `at(scene, "reveal" | "word:N" | number)`,
  `money(x, decimals)`, `rand(seed)`, `clamp01`, `easeOut`.
- `src/shared/Centy.tsx`: the coin mascot (`size, mouth, expr, look, headset, ink, gold, children`).
  Lip-sync: `const m = useMouth(timeline.mouth, scene.start)` then `<Centy mouth={m} />`.
- `src/fonts.ts`: DISPLAY (Archivo Black), BODY (Inter), MONO (Space Grotesk), BALOO, BUNGEE, MARKER, CAVEAT,
  PIXEL (Press Start 2P), PLAYFAIR, PLEX. Already loaded before render.
- Animate only with `useCurrentFrame()` / `interpolate` / `spring`. No CSS transitions, no `Math.random()`.
- Guard `spring({frame: frame - Math.round(x * fps)})` with `Number.isFinite(x)`.

## 3. Layout rules (1080x1920, 60 fps)

- Stage for visuals: x 70-890, y 160-1180. Captions sit at y ~1240-1480. Keep everything out of the
  right 190 px and the bottom 420 px (TikTok/Shorts UI).
- Frame 0 must already show the hook (no fade-in, no blank frame).
- Original art only: no brand logos, no copies of real app UIs, no real people. Brand names as plain text only.
- Every number on screen must be true; show the assumption next to estimates.

## 4. Preview and render

```
export KOKORO_DIR=/home/claude/models
PREVIEW_DIR=/path/to/scratch python3 make_short.py scripts/<slug>.py --preview   # half-size mp4 + contact sheet
python3 make_short.py scripts/<slug>.py                                           # full render to videos/cents/
npx remotion still Short out.png --props='{"slug":"<slug>"}' --frame=N --browser-executable=$REMOTION_BROWSER
```

Type-check with `npx tsc --noEmit` from `remotion/`.
