import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// All fonts are SIL Open Font License (via @fontsource), bundled locally so renders need no network.
// Family names, as registered with loadFont.
const N = {
  display: "Archivo Black",
  body: "Inter",
  mono: "Space Grotesk",
  baloo: "Baloo 2",
  bungee: "Bungee",
  marker: "Permanent Marker",
  caveat: "Caveat",
  pixel: "Press Start 2P",
  playfair: "Playfair Display",
  plex: "IBM Plex Mono",
};

// CSS-ready (quoted) font-family values: names like "Baloo 2" are invalid in CSS without quotes.
const q = (name: string) => `"${name}"`;
export const DISPLAY = q(N.display); // shared caption font
export const BODY = q(N.body);
export const MONO = q(N.mono);
export const BALOO = q(N.baloo);
export const BUNGEE = q(N.bungee);
export const MARKER = q(N.marker);
export const CAVEAT = q(N.caveat);
export const PIXEL = q(N.pixel);
export const PLAYFAIR = q(N.playfair);
export const PLEX = q(N.plex);

const f = (family: string, file: string, weight: string) =>
  loadFont({ family, url: staticFile(`fonts/${file}.woff2`), weight });

export const fontsReady = Promise.all([
  f(N.display, "archivo-black-latin-400-normal", "400"),
  f(N.body, "inter-latin-400-normal", "400"),
  f(N.body, "inter-latin-500-normal", "500"),
  f(N.body, "inter-latin-800-normal", "800"),
  f(N.mono, "space-grotesk-latin-700-normal", "700"),
  f(N.baloo, "baloo-2-latin-800-normal", "800"),
  f(N.bungee, "bungee-latin-400-normal", "400"),
  f(N.marker, "permanent-marker-latin-400-normal", "400"),
  f(N.caveat, "caveat-latin-700-normal", "700"),
  f(N.pixel, "press-start-2p-latin-400-normal", "400"),
  f(N.playfair, "playfair-display-latin-700-normal", "700"),
  f(N.plex, "ibm-plex-mono-latin-700-normal", "700"),
]);
