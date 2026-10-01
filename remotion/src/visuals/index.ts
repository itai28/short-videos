import React from "react";
import { Theme } from "../theme";
import { Scene, Timeline } from "../types";

export type VisualProps = { scene: Scene; theme: Theme; timeline: Timeline; index: number };

// kind -> component. Each scene's `visual.kind` in a script picks one.
export const VISUALS: Record<string, React.FC<VisualProps>> = {};
