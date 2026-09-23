/**
 * ─ Styles ─
 *
 * The runs of classes more than one element shares, each exported
 * once and taken into the className that needs it: the focus ring, a
 * tool's button, and a person's colour with the initial that wears it.
 * Decision: DECISIONS.md, Tailwind v4 tokens.
 */

import type { CSSProperties } from "react";

/** The focus ring, for keyboard focus only; an element adds its own offset. */
export const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-accent";

/** A tool's button: ink on the surface, lit under the pointer, in the accent while pressed or checked, the ring inside its edge. */
export const TOOL =
  "flex items-center justify-center text-ink hover:bg-canvas " +
  "aria-pressed:bg-accent aria-pressed:text-accent-ink aria-pressed:hover:bg-accent " +
  "aria-checked:bg-accent aria-checked:text-accent-ink aria-checked:hover:bg-accent " +
  `${FOCUS_RING} focus-visible:-outline-offset-2`;

/** A person's colour as the ground, with the ink that reads on it; the colour comes in by `personStyle`. */
export const PERSON = "bg-[var(--person)] text-accent-ink";

/** A person's initial on a round mark in their colour; the element adds its size and its edge. */
export const INITIAL = `flex items-center justify-center rounded-full font-sans text-xs font-bold ${PERSON}`;

/** The custom property `PERSON` reads: the person's colour, as a style. */
export function personStyle(color: string): CSSProperties {
  return { "--person": color } as CSSProperties;
}
