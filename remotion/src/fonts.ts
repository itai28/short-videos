import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// All fonts are SIL Open Font License (via @fontsource), bundled locally so renders need no network.
export const DISPLAY = "Archivo Black"; // shared caption font
export const BODY = "Inter";
export const MONO = "Space Grotesk";
export const BALOO = "Baloo 2";
export const BUNGEE = "Bungee";
export const MARKER = "Permanent Marker";
export const CAVEAT = "Caveat";
export const PIXEL = "Press Start 2P";
export const PLAYFAIR = "Playfair Display";
export const PLEX = "IBM Plex Mono";

const f = (family: string, file: string, weight: string) =>
  loadFont({ family, url: staticFile(`fonts/${file}.woff2`), weight });

export const fontsReady = Promise.all([
  f(DISPLAY, "archivo-black-latin-400-normal", "400"),
  f(BODY, "inter-latin-400-normal", "400"),
  f(BODY, "inter-latin-500-normal", "500"),
  f(BODY, "inter-latin-800-normal", "800"),
  f(MONO, "space-grotesk-latin-700-normal", "700"),
  f(BALOO, "baloo-2-latin-800-normal", "800"),
  f(BUNGEE, "bungee-latin-400-normal", "400"),
  f(MARKER, "permanent-marker-latin-400-normal", "400"),
  f(CAVEAT, "caveat-latin-700-normal", "700"),
  f(PIXEL, "press-start-2p-latin-400-normal", "400"),
  f(PLAYFAIR, "playfair-display-latin-700-normal", "700"),
  f(PLEX, "ibm-plex-mono-latin-700-normal", "700"),
]);
