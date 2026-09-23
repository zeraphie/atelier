/**
 * ─ Looks ─
 *
 * Where the others are looking: each peer's look is the world point
 * at the middle of its window and its zoom, so a follower whose window
 * is another size still shows the same middle at the same scale. Your
 * own is made from the camera and the window, rounded so a camera at
 * rest says nothing new.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { screenToWorld, type CameraState, type CanvasSize } from "../camera/index.js";
import { roundedPoint, samePoint, type Point } from "../geometry.js";
import { perPeer } from "./per-peer.js";

export interface Look {
  /** The world point at the middle of the window. */
  readonly centre: Point;
  readonly zoom: number;
}

export type Looks = Readonly<Record<string, Look>>;

const peers = perPeer<Look>();

/** The peers' looks, by peer id. */
export const looks = peers.store;

/** A peer is looking at `look`, or, with null, is gone. */
export const placeLook = peers.place;

/** A peer's look is gone, as when the peer is. */
export const dropLook = peers.drop;

/** No looks at all, as on leaving a viewing. */
export const clearLooks = peers.clear;

/** Your look: the world point at the middle of a window of `size`, to the centimetre, and the zoom to a thousandth. */
export function lookOf(camera: CameraState, size: CanvasSize): Look {
  const centre = screenToWorld(camera, { x: size.width / 2, y: size.height / 2 });
  return { centre: roundedPoint(centre), zoom: Math.round(camera.zoom * 1000) / 1000 };
}

export function sameLook(a: Look, b: Look): boolean {
  return a.zoom === b.zoom && samePoint(a.centre, b.centre);
}
