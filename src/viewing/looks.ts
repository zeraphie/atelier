/**
 * ─ Looks ─
 *
 * Where the others are looking: each peer's look is the world point
 * at the middle of its window and its zoom, so a follower whose window is
 * another size still shows the same middle at the same scale. Kept
 * apart from the store like the cursors, since a look changes every
 * frame of a pan. Your own is made from the camera and the window,
 * rounded so a camera at rest says nothing new.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { screenToWorld, type CameraState, type CanvasSize } from "../camera/index.js";
import { ValueStore } from "../canvas/value-store.js";
import type { Point } from "../geometry.js";
import { roundedPoint, samePoint } from "./cursors.js";

export interface Look {
  /** The world point at the middle of the window. */
  readonly centre: Point;
  readonly zoom: number;
}

export type Looks = Readonly<Record<string, Look>>;

/** The peers' looks, by peer id. */
export const looks = new ValueStore<Looks>({});

/** A peer is looking at `look`, or, with null, is gone. */
export function placeLook(peerId: string, look: Look | null): void {
  if (look === null) {
    dropLook(peerId);
    return;
  }
  looks.set({ ...looks.current, [peerId]: look });
}

/** A peer's look is gone, as when the peer is. */
export function dropLook(peerId: string): void {
  if (!(peerId in looks.current)) {
    return;
  }
  const { [peerId]: _gone, ...rest } = looks.current;
  looks.set(rest);
}

/** No looks at all, as on leaving a viewing. */
export function clearLooks(): void {
  if (Object.keys(looks.current).length > 0) {
    looks.set({});
  }
}

/** Your look: the world point at the middle of a window of `size`, to the centimetre, and the zoom to a thousandth. */
export function lookOf(camera: CameraState, size: CanvasSize): Look {
  const centre = screenToWorld(camera, { x: size.width / 2, y: size.height / 2 });
  return { centre: roundedPoint(centre), zoom: Math.round(camera.zoom * 1000) / 1000 };
}

export function sameLook(a: Look, b: Look): boolean {
  return a.zoom === b.zoom && samePoint(a.centre, b.centre);
}
