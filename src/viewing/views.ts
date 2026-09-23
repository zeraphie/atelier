/**
 * ─ Views ─
 *
 * Where the others are looking: each peer's view as the world point at
 * the middle of its window and its zoom, so a follower whose window is
 * another size still shows the same middle at the same scale. Kept
 * apart from the store like the cursors, since a view changes every
 * frame of a pan. Your own is made from the camera and the window,
 * rounded so a camera at rest says nothing new.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { screenToWorld, type CameraState, type ViewSize } from "../camera/index.js";
import { ValueStore } from "../canvas/value-store.js";
import type { Point } from "../geometry.js";
import { roundedPoint, samePoint } from "./cursors.js";

export interface View {
  /** The world point at the middle of the window. */
  readonly centre: Point;
  readonly zoom: number;
}

export type Views = Readonly<Record<string, View>>;

/** The peers' views, by peer id. */
export const views = new ValueStore<Views>({});

/** A peer is looking at `view`, or, with null, is gone. */
export function placeView(peerId: string, view: View | null): void {
  if (view === null) {
    dropView(peerId);
    return;
  }
  views.set({ ...views.current, [peerId]: view });
}

/** A peer's view is gone, as when the peer is. */
export function dropView(peerId: string): void {
  if (!(peerId in views.current)) {
    return;
  }
  const { [peerId]: _gone, ...rest } = views.current;
  views.set(rest);
}

/** No views at all, as on leaving a viewing. */
export function clearViews(): void {
  if (Object.keys(views.current).length > 0) {
    views.set({});
  }
}

/** Your view: the world point at the middle of a window of `size`, to the centimetre, and the zoom to a thousandth. */
export function viewOf(camera: CameraState, size: ViewSize): View {
  const centre = screenToWorld(camera, { x: size.width / 2, y: size.height / 2 });
  return { centre: roundedPoint(centre), zoom: Math.round(camera.zoom * 1000) / 1000 };
}

export function sameView(a: View, b: View): boolean {
  return a.zoom === b.zoom && samePoint(a.centre, b.centre);
}
