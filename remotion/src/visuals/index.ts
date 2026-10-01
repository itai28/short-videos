import { VisualMap } from "../types";
import { VIDEO_VISUALS } from "../videos";

export type { VisualProps } from "../types";

// kind -> component. Each scene's `visual.kind` in a script picks one.
// Per-video visuals live in src/videos/<slug>/ and use "<slug-prefix>.<name>" kinds, e.g. "box.shelf".
export const VISUALS: VisualMap = { ...VIDEO_VISUALS };
