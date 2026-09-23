/**
 * ─ Icons ─
 *
 * The few marks the interface needs, as inline SVG in the current
 * colour: no icon font, nothing to load. Each is a stroke on a small
 * grid, so they sit together at any size the button gives them.
 */

import type { Direction } from "../../gallery/thresholds.js";

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** A speech bubble: a comment. */
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

/** A pen: editing the gallery. */
export function PenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      {...STROKE}
      strokeWidth={1.4}
      aria-hidden="true"
    >
      <path d="M2.5 11.5l7.5-7.5 1.5 1.5-7.5 7.5H2.5z" />
      <path d="M9 5l1.5 1.5" />
    </svg>
  );
}

// The glyph points right; the others are turns of it.
const TURNS =
  "data-[direction=down]:rotate-90 data-[direction=left]:rotate-180 data-[direction=up]:-rotate-90";

/** An arrow turned to a direction, for a threshold. */
export function ArrowIcon({ direction }: { readonly direction: Direction }) {
  return (
    <svg
      className={TURNS}
      data-direction={direction}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      {...STROKE}
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

// ── The edit rail's tools ──

/** The Move tool's mark. */
export function MoveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" {...STROKE} aria-hidden="true">
      <path d="M3.5 2.5l9.5 5.5-4.2 1.2-2.3 4.3z" />
    </svg>
  );
}

/** The Room tool's mark. */
export function RoomIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" {...STROKE} aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" rx="1" />
      <path d="M6 13.5h4" stroke="var(--color-surface)" strokeWidth="2.4" />
    </svg>
  );
}

/** The Door tool's mark. */
export function DoorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" {...STROKE} aria-hidden="true">
      <path d="M2 11h3.5M10.5 11H14M5.5 11V5h5v6" />
    </svg>
  );
}

/** The Picture tool's mark. */
export function PictureIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" {...STROKE} aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1" />
      <path d="M2.5 11l3-3 2 2 2-3 4 4" />
    </svg>
  );
}

/** The mark for putting everything back. */
export function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" {...STROKE} aria-hidden="true">
      <path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2M3.5 3v2.5H6" />
    </svg>
  );
}

/** A peer's pointer: an arrow in the person's colour, its tip at the top-left corner. */
export function CursorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M1 1v14.5l3.8-3.6 2.6 5.8 2.5-1.1-2.6-5.7 5.2-.3z"
        fill="var(--person)"
        stroke="var(--color-surface)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
