/**
 * ─ Theme bridge ─
 *
 * The canvas draws with Pixi but is coloured by the CSS tokens. A
 * token is read off the document root, put through the browser's own
 * colour parser so oklch and friends come back as hex, and packed.
 * One bridge, so the canvas and the DOM never disagree on a colour.
 * Decision: DECISIONS.md, Tailwind v4 tokens.
 */

import { parseCssColor, type PackedColor } from "./css-color.js";

// A colour no token is, so an answer equal to it means the value was refused.
const SENTINEL = "#010203";

let probe: CanvasRenderingContext2D | null | undefined;

/**
 * The colour a token resolves to right now, or `fallback` when the token
 * is missing or in a form the browser refuses.
 */
export function tokenColor(name: string, fallback: PackedColor): PackedColor {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (raw === "") {
    return fallback;
  }
  return parseCssColor(normalise(raw)) ?? fallback;
}

// A 2D context takes any CSS colour and reads back as hex or rgba().
function normalise(value: string): string {
  probe ??= document.createElement("canvas").getContext("2d");
  if (probe === null) {
    return value;
  }
  probe.fillStyle = SENTINEL;
  probe.fillStyle = value;
  const answer = String(probe.fillStyle);
  return answer === SENTINEL && value.toLowerCase() !== SENTINEL ? value : answer;
}
