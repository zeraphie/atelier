/**
 * ─ Tap math ─
 *
 * Whether a press was a tap or a drag, and whether a tap doubles the
 * one before. A press that travelled under a few pixels is a tap; a
 * second tap soon enough and close enough is a double tap, and a
 * double tap starts no third, so three quick taps are one double and
 * one single. Pure, on points and times, so the rule is tested without
 * a pointer.
 * Decision: DECISIONS.md, scroll pans, pinch zooms.
 */

import type { Point } from "../../geometry.js";

// Pointer travel under this is a tap on the canvas rather than a pan.
export const TAP_THRESHOLD_PX = 4;
// A second tap this soon and this close to the first is a double tap.
export const DOUBLE_TAP_MS = 300;
export const DOUBLE_TAP_PX = 24;

/** A tap: where on the element, and when. */
export interface Tap {
  readonly at: Point;
  readonly time: number;
}

/** Whether a press that went down at `origin` and came up at `end` stayed still enough to be a tap. */
export function isTap(origin: Point, end: Point): boolean {
  return Math.hypot(end.x - origin.x, end.y - origin.y) < TAP_THRESHOLD_PX;
}

/** Whether `tap` doubles `last`: soon enough after it, and close enough to it. */
export function isDoubleTap(tap: Tap, last: Tap | undefined): boolean {
  return (
    last !== undefined &&
    tap.time - last.time < DOUBLE_TAP_MS &&
    Math.hypot(tap.at.x - last.at.x, tap.at.y - last.at.y) < DOUBLE_TAP_PX
  );
}

/** The tap to hold for the next one: none after a double, so a third tap is a single. */
export function tapToHold(tap: Tap, isDouble: boolean): Tap | undefined {
  return isDouble ? undefined : tap;
}
