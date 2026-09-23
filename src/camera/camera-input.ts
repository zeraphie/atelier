/**
 * ─ Camera input ─
 *
 * Maps pointer and wheel events on the canvas element to camera calls,
 * for mouse, touch and pen alike: the wheel pans and with Ctrl zooms
 * about the cursor, one pointer pans, two pinch, and a tap or a double tap on nothing is
 * reported. Pins are DOM above the canvas, so a press on one never
 * reaches the canvas element, and the camera only ever moves from
 * empty canvas. The element must set `touch-action: none`, or the
 * browser takes touch gestures for itself.
 */

import type { Point } from "../geometry.js";
import type { Camera } from "./camera.js";
import { pinchStep } from "./pinch-math.js";
import { wheelIntent } from "./wheel-math.js";

const LEFT_BUTTON = 0;
const MIDDLE_BUTTON = 1;
// Pointer travel under this is a tap on the canvas rather than a pan.
const TAP_THRESHOLD_PX = 4;
// A second tap this soon and this close to the first is a double tap.
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 24;

/** The keys held as a tap was made, for a listener that reads them. */
export interface TapModifiers {
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

/**
 * Called when a press on empty canvas ends without travelling: a click on
 * nothing, at that point on the canvas element, with the keys held.
 */
export type CanvasTapListener = (at: Point, modifiers: TapModifiers) => void;

/** Binds camera gestures to `target` until `dispose` is called. */
export class CameraInput {
  private readonly camera: Camera;
  private readonly target: HTMLElement;
  private readonly pointers = new Map<number, Point>();
  private readonly pressOrigins = new Map<number, Point>();
  private readonly tapListeners = new Set<CanvasTapListener>();
  private readonly doubleTapListeners = new Set<CanvasTapListener>();
  private lastTap: { readonly at: Point; readonly time: number } | undefined;

  constructor(camera: Camera, target: HTMLElement) {
    this.camera = camera;
    this.target = target;
    target.addEventListener("wheel", this.onWheel, { passive: false });
    target.addEventListener("pointerdown", this.onPointerDown);
    target.addEventListener("pointermove", this.onPointerMove);
    target.addEventListener("pointerup", this.onPointerEnd);
    target.addEventListener("pointercancel", this.onPointerEnd);
    // A long press on touch would otherwise open the browser's own menu mid-pan.
    target.addEventListener("contextmenu", this.onContextMenu);
  }

  dispose(): void {
    this.target.removeEventListener("contextmenu", this.onContextMenu);
    this.target.removeEventListener("wheel", this.onWheel);
    this.target.removeEventListener("pointerdown", this.onPointerDown);
    this.target.removeEventListener("pointermove", this.onPointerMove);
    this.target.removeEventListener("pointerup", this.onPointerEnd);
    this.target.removeEventListener("pointercancel", this.onPointerEnd);
    this.pointers.clear();
    this.pressOrigins.clear();
    this.target.removeAttribute("data-camera");
  }

  /** Subscribe to taps on empty canvas; returns the unsubscribe function. */
  onTap(listener: CanvasTapListener): () => void {
    this.tapListeners.add(listener);
    return () => {
      this.tapListeners.delete(listener);
    };
  }

  /** Subscribe to double taps on empty canvas; returns the unsubscribe function. */
  onDoubleTap(listener: CanvasTapListener): () => void {
    this.doubleTapListeners.add(listener);
    return () => {
      this.doubleTapListeners.delete(listener);
    };
  }

  // Only while a pointer is held: a right click with nothing held is the
  // app's to answer with a menu of its own.
  private readonly onContextMenu = (event: Event): void => {
    if (this.pointers.size > 0) {
      event.preventDefault();
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = this.target.getBoundingClientRect();
    const intent = wheelIntent(event, { width: rect.width, height: rect.height });
    if (intent.kind === "zoom") {
      const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      this.camera.zoomAt(anchor, intent.factor);
    } else {
      this.camera.panBy(intent.dx, intent.dy);
    }
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const isPanButton = event.button === LEFT_BUTTON || event.button === MIDDLE_BUTTON;
    if (event.pointerType === "mouse" && !isPanButton) {
      return;
    }
    // A third finger adds nothing to a pinch and would only confuse it.
    if (this.pointers.size >= 2) {
      return;
    }
    event.preventDefault();
    this.target.setPointerCapture(event.pointerId);
    const at = { x: event.clientX, y: event.clientY };
    this.pointers.set(event.pointerId, at);
    this.pressOrigins.set(event.pointerId, at);
    this.target.setAttribute("data-camera", "panning");
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const previous = this.pointers.get(event.pointerId);
    if (previous === undefined) {
      return;
    }
    const current = { x: event.clientX, y: event.clientY };
    if (this.pointers.size === 1) {
      this.camera.panBy(current.x - previous.x, current.y - previous.y);
    } else {
      this.applyPinch(event.pointerId, previous, current);
    }
    this.pointers.set(event.pointerId, current);
  };

  private readonly onPointerEnd = (event: PointerEvent): void => {
    if (!this.pointers.delete(event.pointerId)) {
      return;
    }
    const origin = this.pressOrigins.get(event.pointerId);
    this.pressOrigins.delete(event.pointerId);
    if (this.target.hasPointerCapture(event.pointerId)) {
      this.target.releasePointerCapture(event.pointerId);
    }
    if (this.pointers.size === 0) {
      this.target.removeAttribute("data-camera");
    }
    // A single pointer that pressed and released in place is a tap on nothing.
    const isTap =
      event.type === "pointerup" &&
      origin !== undefined &&
      this.pointers.size === 0 &&
      Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < TAP_THRESHOLD_PX;
    if (isTap) {
      const rect = this.target.getBoundingClientRect();
      const at = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const last = this.lastTap;
      const isDouble =
        last !== undefined &&
        event.timeStamp - last.time < DOUBLE_TAP_MS &&
        Math.hypot(at.x - last.at.x, at.y - last.at.y) < DOUBLE_TAP_PX;
      this.lastTap = isDouble ? undefined : { at, time: event.timeStamp };
      const modifiers = {
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      };
      for (const listener of isDouble ? this.doubleTapListeners : this.tapListeners) {
        listener(at, modifiers);
      }
    }
  };

  private applyPinch(movedId: number, previous: Point, current: Point): void {
    const other = [...this.pointers].find(([id]) => id !== movedId);
    if (other === undefined) {
      return;
    }
    const rect = this.target.getBoundingClientRect();
    const step = pinchStep([previous, other[1]], [current, other[1]]);
    this.camera.panBy(step.dx, step.dy);
    this.camera.zoomAt({ x: step.anchor.x - rect.left, y: step.anchor.y - rect.top }, step.factor);
  }
}
