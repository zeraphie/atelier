/**
 * ─ Cursors ─
 *
 * Where the others' pointers are, in the world: a point per peer for
 * as long as it is over its canvas, gone when it leaves it or the
 * viewing. Kept apart from the store, since a cursor moves every frame
 * and only its layer needs to know. And the saying of your own: the
 * latest point once a frame at most, only when it changed, whole
 * centimetres since that is the world's unit, and once that it is
 * gone. Pure, so the pace is tested without a browser.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { FrameScheduler } from "../canvas/frame-scheduler.js";
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

/**
 * Says where your pointer is: once a frame at most, however often it
 * moved, and only when the point said would differ from the last; that
 * it is nowhere is said once, and never before anything was.
 */
export class CursorSayer {
  private latest: Point | undefined;
  /** What was said last; nothing yet, or nowhere. */
  private said: Point | null | undefined;
  private readonly frames: FrameScheduler;

  /** `refresh` runs its callback at the next screen refresh; `send` is what the saying is. */
  constructor(
    refresh: (tell: () => void) => void,
    private readonly send: (at: Point | null) => void
  ) {
    this.frames = new FrameScheduler(refresh, () => this.flush());
  }

  /** The pointer is at `at` in the world, or off the canvas. */
  say(at: Point | undefined): void {
    this.latest = at === undefined ? undefined : { x: Math.round(at.x), y: Math.round(at.y) };
    this.frames.ask();
  }

  /** Say the latest again whatever was said, as to a peer who just arrived. */
  sayAgain(): void {
    this.said = undefined;
    this.frames.ask();
  }

  private flush(): void {
    const next = this.latest ?? null;
    const isUnchanged = this.said === undefined ? next === null : isSame(this.said, next);
    if (isUnchanged) {
      return;
    }
    this.said = next;
    this.send(next);
  }
}

function isSame(a: Point | null, b: Point | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a.x === b.x && a.y === b.y;
}
