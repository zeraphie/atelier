/**
 * ─ Colour ─
 *
 * A person's colour, from their name and nothing else: the same name
 * is the same colour on every screen without anyone agreeing on it.
 * The name is hashed to a hue, and the hue set in the palette's own
 * lightness and chroma, so every colour sits with the accent.
 * Decision: DECISIONS.md, identity is a name and a colour.
 */

const LIGHTNESS = "58%";
const CHROMA = 0.16;

/** The hue a name hashes to, in degrees. */
export function hueOf(name: string): number {
  // FNV-1a over the code units: fast, spread, and the same everywhere.
  let hash = 0x811c9dc5;
  for (const char of name) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 360;
}

/** The colour a name is shown in, as CSS. */
export function colorFor(name: string): string {
  return `oklch(${LIGHTNESS} ${CHROMA} ${hueOf(name)})`;
}

/** The initial a name is shown by. */
export function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}
