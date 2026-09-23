/**
 * ─ Tour ─
 *
 * The works one after another. Start takes the view to the first, and
 * next and previous glide it straight to the one either side, each
 * filling the view with its label; a double tap on a work joins the
 * tour there, and play steps on by itself until the last. Where it
 * stands and whether it is playing are values React can watch, so the
 * controls come and go with them; a hand on the canvas stops any glide
 * and leaves the count where it was.
 * Decision: DECISIONS.md, a route through the rooms.
 */

import {
  glide,
  MOVE_MS,
  type Camera,
  type Frame,
  type CanvasSize,
  type WorldRect,
} from "../camera/index.js";
import type { Route, Stop } from "../gallery/route.js";
import { ValueStore } from "./value-store.js";

/** What the tour controls need: where the tour stands, and the moves. */
export interface TourHandle {
  /** The stop the tour is at, or -1 while it is not on. */
  readonly stop: ValueStore<number>;
  /** Whether the tour is stepping on by itself. */
  readonly playing: ValueStore<boolean>;
  readonly count: number;
  /** Begin at the first work. */
  start(): void;
  /** Join at a work the view has already reached. */
  enterAt(workId: string): void;
  next(): void;
  previous(): void;
  /** Step on by itself, a while at each work, from the start if not on the tour. */
  play(): void;
  pause(): void;
  /** Step off the tour; the view stays where it is. */
  leave(): void;
}

export interface TourOptions {
  readonly camera: Camera;
  /** The route as it stands; it changes when the plan does. */
  readonly route: () => Route;
  readonly canvasSize: () => CanvasSize;
  /** The work with its label, for the view to fit. */
  readonly extentOf: (stop: Stop) => WorldRect;
  /** Screen pixels kept clear around a work when it fills the view. */
  readonly fitPadding: number;
  readonly frame?: Frame;
  /** Whether motion is reduced: jump to the work instead of gliding. */
  readonly isMotionReduced: () => boolean;
}

// How long play stays at each work.
const DWELL_MS = 4000;

/** The works in route order, with next and previous. */
export class Tour implements TourHandle {
  readonly stop = new ValueStore(-1);
  readonly playing = new ValueStore(false);
  private readonly options: TourOptions;
  private halt: (() => void) | undefined;
  private ticker: ReturnType<typeof setInterval> | undefined;

  constructor(options: TourOptions) {
    this.options = options;
  }

  get count(): number {
    return this.options.route().stops.length;
  }

  start(): void {
    this.go(0);
  }

  enterAt(workId: string): void {
    const index = this.options.route().stops.findIndex((stop) => stop.work.work.id === workId);
    if (index >= 0) {
      this.stop.set(index);
    }
  }

  next(): void {
    this.go(this.stop.current + 1);
  }

  previous(): void {
    this.go(this.stop.current - 1);
  }

  play(): void {
    if (this.playing.current) {
      return;
    }
    if (this.stop.current < 0) {
      this.start();
    }
    this.playing.set(true);
    this.ticker = setInterval(() => {
      if (this.stop.current >= this.count - 1) {
        this.pause();
        return;
      }
      this.next();
    }, DWELL_MS);
  }

  pause(): void {
    clearInterval(this.ticker);
    this.ticker = undefined;
    this.playing.set(false);
  }

  leave(): void {
    this.pause();
    this.halt?.();
    this.halt = undefined;
    this.stop.set(-1);
  }

  /** Stop any move in progress and any play. */
  dispose(): void {
    this.pause();
    this.halt?.();
    this.halt = undefined;
  }

  private go(index: number): void {
    const { camera, route, extentOf, fitPadding, isMotionReduced } = this.options;
    const target = route().stops[index];
    if (target === undefined) {
      return;
    }
    const size = this.options.canvasSize();
    const there = camera.fitted(size, extentOf(target), fitPadding);
    this.halt?.();
    this.stop.set(index);
    this.halt = glide(
      camera,
      there,
      size,
      isMotionReduced() ? 0 : MOVE_MS,
      this.options.frame ?? requestAnimationFrame
    );
  }
}
