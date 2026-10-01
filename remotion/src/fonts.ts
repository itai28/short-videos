import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// All fonts are SIL Open Font License (via @fontsource), bundled locally so renders need no network.
export const DISPLAY = "Archivo Black";
export const BODY = "Inter";
export const MONO = "Space Grotesk";

export const fontsReady = Promise.all([
  loadFont({ family: DISPLAY, url: staticFile("fonts/archivo-black-latin-400-normal.woff2"), weight: "400" }),
  loadFont({ family: BODY, url: staticFile("fonts/inter-latin-500-normal.woff2"), weight: "500" }),
  loadFont({ family: BODY, url: staticFile("fonts/inter-latin-800-normal.woff2"), weight: "800" }),
  loadFont({ family: MONO, url: staticFile("fonts/space-grotesk-latin-700-normal.woff2"), weight: "700" }),
]);
