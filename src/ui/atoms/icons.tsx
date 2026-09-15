/**
 * ─ Icons ─
 *
 * The few marks the interface needs, as inline SVG in the current
 * colour: no icon font, nothing to load.
 */

import type { Direction } from "../../gallery/thresholds.js";

export function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 2.5h10v7H6l-3 2.5v-2.5H2z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The glyph points right; the others are turns of it.
const TURNS =
  "data-[direction=down]:rotate-90 data-[direction=left]:rotate-180 data-[direction=up]:-rotate-90";

export function ArrowIcon({ direction }: { readonly direction: Direction }) {
  return (
    <svg
      className={TURNS}
      data-direction={direction}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
