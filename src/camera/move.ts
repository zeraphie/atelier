/**
 * ─ Move ─
 *
 * How the camera goes somewhere by itself: a glide of one length, or
 * a jump for a person who asked for less motion. Every move the
 * interface makes comes through here, a tour step, a double tap, a
 * jump to a comment, the fit key, so they all take the same time and
 * honour the same preference, and what a fit keeps clear is one
 * pair of numbers.
 */

import type { CameraState, CanvasSize } from "./camera-math.js";
import type { Camera } from "./camera.js";
import { glide } from "./glide.js";

/** How long a move takes: long enough to follow, short enough not to wait for. */
export const MOVE_MS = 600;

/** Screen pixels kept clear around a work or the plan when the view fits it. */
export const FIT_PADDING = 48;

/** A fit of the plan never comes closer than life size, however small the plan. */
export const LIFE_SIZE = 1;

/** Whether the person has asked the system for less motion. */
export function isMotionReduced(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Take the camera to `to`, gliding, or at once under reduced motion; returns a function that stops the move. */
export function moveTo(camera: Camera, to: CameraState, size: CanvasSize): () => void {
  return glide(camera, to, size, isMotionReduced() ? 0 : MOVE_MS);
}

/** A quarter per press of a zoom key or button, the step Figma's zoom buttons take. */
export const ZOOM_STEP = 1.25;
