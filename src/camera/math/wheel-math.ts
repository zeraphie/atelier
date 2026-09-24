/**
 * ─ Wheel math ─
 *
 * What a wheel event asks for, as the design tools have it: a plain
 * wheel or two-finger scroll pans, and a pinch, which browsers send as
 * a wheel with Ctrl held, zooms about the cursor, as does Ctrl or
 * Command with a mouse wheel. Wheel events differ by device and
 * browser, pixels from trackpads, lines or pages from some mouse
 * drivers, tiny deltas from a pinch, so they are made one currency
 * first, and the input layer stays a thin mapping of events to camera
 * calls.
 * Decision: DECISIONS.md, scroll pans, pinch zooms.
 */

import type { CanvasSize } from "./camera-math.js";

// WheelEvent.deltaMode values; the DOM constants live on the event, not the type.
const DELTA_LINE = 1;
const DELTA_PAGE = 2;

// A line is roughly a text row; browsers that report lines do not say how tall.
const LINE_PX = 16;

// A pinch that doubles the distance between the fingers arrives as about
// a hundred pixels of delta, and should double the zoom. A mouse notch is
// a hundred pixels too, so one event is capped, and a notch with Ctrl is
// a clear step rather than a doubling.
const ZOOM_DOUBLING_PX = 100;
const ZOOM_EVENT_MOST_PX = 20;

/** The parts of a wheel event the mapping reads. */
export interface WheelInput {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaMode: number;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

/** A zoom by a factor about the cursor, or a pan by a screen delta. */
export type WheelIntent =
  | { readonly kind: "zoom"; readonly factor: number }
  | { readonly kind: "pan"; readonly dx: number; readonly dy: number };

/** Normalise a wheel delta to pixels. `pageSize` is the viewport extent on that axis. */
export function wheelDeltaToPixels(delta: number, deltaMode: number, pageSize: number): number {
  if (deltaMode === DELTA_LINE) {
    return delta * LINE_PX;
  }
  if (deltaMode === DELTA_PAGE) {
    return delta * pageSize;
  }
  return delta;
}

/** Zoom factor for a wheel delta in pixels with Ctrl held: a pinch out, or a wheel up, zooms in. */
export function wheelZoomFactor(deltaYPixels: number): number {
  const capped = Math.max(-ZOOM_EVENT_MOST_PX, Math.min(ZOOM_EVENT_MOST_PX, deltaYPixels));
  return 2 ** (-capped / ZOOM_DOUBLING_PX);
}

/**
 * What a wheel event asks of the camera. Shift turns a mouse wheel's only
 * axis sideways, for browsers that do not do that themselves.
 */
export function wheelIntent(input: WheelInput, size: CanvasSize): WheelIntent {
  const dy = wheelDeltaToPixels(input.deltaY, input.deltaMode, size.height);
  if (input.ctrlKey || input.metaKey) {
    return { kind: "zoom", factor: wheelZoomFactor(dy) };
  }
  const dx = wheelDeltaToPixels(input.deltaX, input.deltaMode, size.width);
  if (input.shiftKey && dx === 0) {
    return { kind: "pan", dx: -dy, dy: 0 };
  }
  return { kind: "pan", dx: -dx, dy: -dy };
}
