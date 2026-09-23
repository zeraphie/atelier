/**
 * ─ Cursors ─
 *
 * Where the others' pointers are, in the world: a point per peer for
 * as long as it is over its canvas, gone when it leaves it or the
 * viewing. Kept apart from the store, since a cursor moves every frame
 * and only its layer needs to know. Your own is said to the centimetre,
 * the world's unit, so a pointer at rest says nothing new.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { ValueStore } from "../canvas/value-store.js";
import type { Point } from "../geometry.js";

export type Cursors = Readonly<Record<string, Point>>;

/** The peers' pointers in the world, by peer id; only those over their canvas. */
export const cursors = new ValueStore<Cursors>({});

/** A peer's pointer is at `at`, or, with null, has left its canvas. */
export function placeCursor(peerId: string, at: Point | null): void {
  if (at === null) {
    dropCursor(peerId);
    return;
  }
  cursors.set({ ...cursors.current, [peerId]: at });
}

/** A peer's pointer is gone, as when the peer is. */
export function dropCursor(peerId: string): void {
  if (!(peerId in cursors.current)) {
    return;
  }
  const { [peerId]: _gone, ...rest } = cursors.current;
  cursors.set(rest);
}

/** No pointers at all, as on leaving a viewing. */
export function clearCursors(): void {
  if (Object.keys(cursors.current).length > 0) {
    cursors.set({});
  }
}

/** A point to the centimetre. */
export function roundedPoint(at: Point): Point {
  return { x: Math.round(at.x), y: Math.round(at.y) };
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}
