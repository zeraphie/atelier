/**
 * ─ Glide ─
 *
 * A camera move over time. The world point at the centre of the view
 * travels in a straight line, and the zoom changes by ratio, so a move
 * that halves the zoom is the reverse of one that doubles it. The
 * interpolation is pure; the runner paces it with frames and stops
 * the moment anything else moves the camera, so a person's own pan
 * always wins.
 */

import type { Point } from "../../geometry.js";
import { screenToWorld, type CameraState, type CanvasSize } from "./camera-math.js";
import type { Camera } from "../camera.js";

/** Runs its callback at the next frame with the time: requestAnimationFrame. */
export type Frame = (callback: (time: number) => void) => void;

/** Ease in and out, as a cubic: slow to start, slow to arrive. */
export function eased(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** The camera that puts `point` at the centre of a canvas of `size` at `zoom`. */
export function centredOn(point: Point, zoom: number, size: CanvasSize): CameraState {
  return { x: size.width / 2 - point.x * zoom, y: size.height / 2 - point.y * zoom, zoom };
}

/** The state `t` of the way from `from` to `to`, 0 to 1, for a canvas of `size`. */
export function between(
  from: CameraState,
  to: CameraState,
  size: CanvasSize,
  t: number
): CameraState {
  const k = eased(t);
  const middle = { x: size.width / 2, y: size.height / 2 };
  const start = screenToWorld(from, middle);
  const end = screenToWorld(to, middle);
  const zoom = from.zoom * (to.zoom / from.zoom) ** k;
  const centre = { x: start.x + (end.x - start.x) * k, y: start.y + (end.y - start.y) * k };
  return centredOn(centre, zoom, size);
}

/**
 * Move `camera` to `to` over `ms`. Returns a function that stops the move;
 * it also stops on its own if the camera is moved by anything else. With
 * no time, the camera is simply set.
 */
export function glide(
  camera: Camera,
  to: CameraState,
  size: CanvasSize,
  ms: number,
  frame: Frame = requestAnimationFrame
): () => void {
  if (ms <= 0) {
    camera.set(to);
    return () => {};
  }
  const from = camera.current;
  let last = from;
  let start: number | undefined;
  let isStopped = false;
  const tick = (time: number): void => {
    if (isStopped || camera.current !== last) {
      return;
    }
    start ??= time;
    const t = Math.min(1, (time - start) / ms);
    last = between(from, to, size, t);
    camera.set(last);
    if (t < 1) {
      frame(tick);
    }
  };
  frame(tick);
  return () => {
    isStopped = true;
  };
}
