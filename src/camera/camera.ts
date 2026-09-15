/**
 * ─ Camera ─
 *
 * One transform for the whole world, as state and listeners and
 * nothing else: it imports no renderer. Pan and zoom go through the
 * pure camera math, and every change reaches each listener once, so
 * the stage's world container and the pins in the DOM follow the
 * same numbers in the same frame.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import type { Point, WorldRect } from "../geometry.js";
import {
  fitToRect,
  pan,
  screenToWorld,
  worldToScreen,
  zoomAbout,
  type CameraState,
  type ViewSize,
  type ZoomLimits,
} from "./camera-math.js";

export type CameraListener = (state: CameraState) => void;

// Far enough to see every room at once, close enough to read a print at the scan's own pixels.
const DEFAULT_LIMITS: ZoomLimits = { min: 0.05, max: 32 };

/** Owns the view transform and tells its listeners when it changes. */
export class Camera {
  private readonly limits: ZoomLimits;
  private readonly listeners = new Set<CameraListener>();
  private state: CameraState = { x: 0, y: 0, zoom: 1 };

  constructor(limits: ZoomLimits = DEFAULT_LIMITS) {
    this.limits = limits;
  }

  get current(): CameraState {
    return this.state;
  }

  /** Shift the view by a screen-space delta. */
  panBy(dx: number, dy: number): void {
    this.set(pan(this.state, dx, dy));
  }

  /** Scale the view by `factor`, keeping the world point under `anchor` (screen space) fixed. */
  zoomAt(anchor: Point, factor: number): void {
    this.set(zoomAbout(this.state, anchor, factor, this.limits));
  }

  /**
   * Show all of `rect` centred in a view of `view` size, with `padding` screen
   * pixels clear and the zoom no closer than `most`.
   */
  fit(view: ViewSize, rect: WorldRect, padding = 0, most?: number): void {
    this.set(this.fitted(view, rect, padding, most));
  }

  /** The state `fit` would move to, for a move over time. */
  fitted(view: ViewSize, rect: WorldRect, padding = 0, most?: number): CameraState {
    return fitToRect(view, rect, this.limits, padding, most);
  }

  /** Replace the whole state, for example at the end of an animated move. */
  set(state: CameraState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  toWorld(screen: Point): Point {
    return screenToWorld(this.state, screen);
  }

  toScreen(world: Point): Point {
    return worldToScreen(this.state, world);
  }

  /** Subscribe to changes; returns the unsubscribe function. */
  onChange(listener: CameraListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
