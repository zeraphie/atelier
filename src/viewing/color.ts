/**
 * ─ Colour ─
 *
 * A person's colour: one of eight, chosen, and the same on every screen
 * because it travels with the name. The eight are made from one blue,
 * #08c, kept at its lightness and chroma with the hue turned in equal
 * steps, so every one stands against the canvas alike and no two are
 * told apart by hue alone. Until a person chooses, their name picks
 * one: it hashes to a hue, and the nearest of the eight is theirs.
 * Decision: DECISIONS.md, identity is a name and a colour.
 */

export interface Swatch {
  readonly id: string;
  readonly name: string;
  readonly hue: number;
}

// The blue, #08c, in the palette's own terms; the seven others turn from it.
const LIGHTNESS = "60%";
const CHROMA = 0.14;
const BLUE_HUE = 241.5;
const STEP = 45;

/** The eight colours, in the rainbow's order. */
export const PALETTE: readonly Swatch[] = [
  { id: "red", name: "Red", hue: BLUE_HUE + 3 * STEP - 360 },
  { id: "orange", name: "Orange", hue: BLUE_HUE + 4 * STEP - 360 },
  { id: "yellow", name: "Yellow", hue: BLUE_HUE + 5 * STEP - 360 },
  { id: "green", name: "Green", hue: BLUE_HUE + 6 * STEP - 360 },
  { id: "teal", name: "Teal", hue: BLUE_HUE + 7 * STEP - 360 },
  { id: "blue", name: "Blue", hue: BLUE_HUE },
  { id: "purple", name: "Purple", hue: BLUE_HUE + STEP },
  { id: "pink", name: "Pink", hue: BLUE_HUE + 2 * STEP },
];

/** The CSS colour of a swatch, by id; an unknown id is the blue. */
export function colorOf(id: string): string {
  const swatch = PALETTE.find((known) => known.id === id) ?? PALETTE[5]!;
  return `oklch(${LIGHTNESS} ${CHROMA} ${swatch.hue})`;
}

/** The hue a name hashes to, in degrees. */
export function hueOf(name: string): number {
  // FNV-1a over the code points: fast, spread, and the same everywhere.
  let hash = 0x811c9dc5;
  for (const char of name) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 360;
}

/** The swatch a name lands on until a colour is chosen: the nearest to the hue it hashes to. */
export function swatchFor(name: string): Swatch {
  const hue = hueOf(name);
  return PALETTE.reduce((best, swatch) =>
    apart(swatch.hue, hue) < apart(best.hue, hue) ? swatch : best
  );
}

/** The colour a name is shown in, chosen or not: its swatch's, or the one its name lands on. */
export function colorFor(name: string, chosen?: string): string {
  return colorOf(chosen ?? swatchFor(name).id);
}

/** The initial a name is shown by. */
export function initialOf(name: string): string {
  return name.trim().slice(0, 1).toUpperCase();
}

// How far apart two hues are, the short way round the circle.
function apart(a: number, b: number): number {
  const difference = Math.abs(a - b) % 360;
  return Math.min(difference, 360 - difference);
}

/** The swatch a person acts in: the one chosen, or the one their name lands on. */
export function swatchIdFor(name: string, chosen: string | undefined): string {
  return chosen ?? swatchFor(name).id;
}
