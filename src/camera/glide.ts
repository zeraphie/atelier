/**
 * ─ Glide ─
 *
 * Camera moves over time. A glide takes the world point at the centre
 * of the view in a straight line and changes the zoom by ratio, so a
 * move that halves the zoom is the reverse of one that doubles it; a
 * glide along a path takes that point down the path by distance. The
 * interpolation is pure; the runners pace it with frames and stop the
 * moment anything else moves the camera, so a person's own pan always
 * wins.
 */

import { screenToWorld, type CameraState, type ViewSize } from "./camera-math.js";
import type { Camera } from "./camera.js";
import type { Point } from "../geometry.js";

/** Runs its callback at the next frame with the time: requestAnimationFrame. */
export type Frame = (callback: (time: number) => void) => void;

/** Told once a move ends: whether it arrived, or was stopped short. */
export type Done = (arrived: boolean) => void;

/** Ease in and out, as a cubic: slow to start, slow to arrive. */
export function eased(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

/** The camera that puts `point` at the centre of `view` at `zoom`. */
export function centredOn(point: Point, zoom: number, view: ViewSize): CameraState {
  return { x: view.width / 2 - point.x * zoom, y: view.height / 2 - point.y * zoom, zoom };
}

/** The state `t` of the way from `from` to `to`, 0 to 1, for a view of `view`. */
export function between(
  from: CameraState,
  to: CameraState,
  view: ViewSize,
  t: number
): CameraState {
  const k = eased(t);
  const middle = { x: view.width / 2, y: view.height / 2 };
  const start = screenToWorld(from, middle);
  const end = screenToWorld(to, middle);
  const zoom = from.zoom * (to.zoom / from.zoom) ** k;
  const centre = { x: start.x + (end.x - start.x) * k, y: start.y + (end.y - start.y) * k };
  return centredOn(centre, zoom, view);
}

/** How long `path` is. */
export function pathLength(path: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += Math.hypot(path[i]!.x - path[i - 1]!.x, path[i]!.y - path[i - 1]!.y);
  }
  return total;
}

/** The point `fraction` of the way along `path` by distance, 0 to 1. */
export function along(path: readonly Point[], fraction: number): Point {
  const first = path[0];
  if (first === undefined) {
    throw new Error("a path needs at least one point");
  }
  let left = Math.min(1, Math.max(0, fraction)) * pathLength(path);
  for (let i = 1; i < path.length; i += 1) {
    const a = path[i - 1]!;
    const b = path[i]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= length) {
      const t = length === 0 ? 0 : left / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    left -= length;
  }
  return path[path.length - 1] ?? first;
}

// A move paced by frames: `at` gives the state for a share of the time,
// and the move stops itself if the camera is found moved by anything else.
function run(
  camera: Camera,
  ms: number,
  at: (t: number) => CameraState,
  frame: Frame,
  done: Done | undefined
): () => void {
  let last = camera.current;
  let start: number | undefined;
  let isStopped = false;
  const tick = (time: number): void => {
    if (isStopped) {
      return;
    }
    if (camera.current !== last) {
      isStopped = true;
      done?.(false);
      return;
    }
    start ??= time;
    const t = Math.min(1, (time - start) / ms);
    last = at(t);
    camera.set(last);
    if (t < 1) {
      frame(tick);
    } else {
      isStopped = true;
      done?.(true);
    }
  };
  frame(tick);
  return () => {
    if (!isStopped) {
      isStopped = true;
      done?.(false);
    }
  };
}

/**
 * Move `camera` to `to` over `ms`. Returns a function that stops the move;
 * it also stops on its own if the camera is moved by anything else. With
 * no time, the camera is simply set.
 */
export function glide(
  camera: Camera,
  to: CameraState,
  view: ViewSize,
  ms: number,
  frame: Frame = requestAnimationFrame,
  done?: Done
): () => void {
  if (ms <= 0) {
    camera.set(to);
    done?.(true);
    return () => {};
  }
  const from = camera.current;
  return run(camera, ms, (t) => between(from, to, view, t), frame, done);
}

/** Take the centre of the view down `path` at `zoom` over `ms`, eased; stops as a glide does. */
export function glideAlong(
  camera: Camera,
  path: readonly Point[],
  zoom: number,
  view: ViewSize,
  ms: number,
  frame: Frame = requestAnimationFrame,
  done?: Done
): () => void {
  if (ms <= 0) {
    camera.set(centredOn(along(path, 1), zoom, view));
    done?.(true);
    return () => {};
  }
  return run(camera, ms, (t) => centredOn(along(path, eased(t)), zoom, view), frame, done);
}
