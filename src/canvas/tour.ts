/**
 * ─ Tour ─
 *
 * Next and previous along the route. The camera goes back to the
 * standing point it left from, walks the path to the next work at a
 * walking zoom, through the doorway if there is one, and settles with
 * the work and its label filling the view. Where it stands is a value
 * React can watch; a hand on the canvas stops any leg, and the next
 * press picks up from the last stop.
 * Decision: DECISIONS.md, a route through the rooms.
 */

import {
  centredOn,
  glide,
  glideAlong,
  pathLength,
  type Camera,
  type Frame,
  type ViewSize,
  type WorldRect,
} from "../camera/index.js";
import type { Point } from "../geometry.js";
import type { Route, Stop } from "../gallery/route.js";
import { ValueStore } from "./value-store.js";

/** What the tour controls need: where the walk stands, and the two moves. */
export interface TourHandle {
  /** The stop the walk is at, or -1 before it has begun. */
  readonly stop: ValueStore<number>;
  readonly count: number;
  next(): void;
  previous(): void;
}

export interface TourOptions {
  readonly camera: Camera;
  readonly route: Route;
  readonly view: () => ViewSize;
  /** The work with its label, for the settle. */
  readonly extentOf: (stop: Stop) => WorldRect;
  /** Screen pixels kept clear around a work when it fills the view. */
  readonly fitPadding: number;
  readonly frame?: Frame;
  /** Whether motion is reduced: jump to the work instead of walking. */
  readonly isMotionReduced: () => boolean;
}

// Walking, the view's shorter side shows this much of the world.
const WALK_SPAN_CM = 500;
// How long a leg takes per centimetre of path, within limits.
const MS_PER_CM = 1.4;
const LEAST_WALK_MS = 400;
const MOST_WALK_MS = 1600;
// The move back to the standing point, and the settle on the work.
const APPROACH_MS = 350;
const SETTLE_MS = 550;

/** The walk along the route, with next and previous. */
export class Tour implements TourHandle {
  readonly stop = new ValueStore(-1);
  private readonly options: TourOptions;
  private halt: (() => void) | undefined;

  constructor(options: TourOptions) {
    this.options = options;
  }

  get count(): number {
    return this.options.route.stops.length;
  }

  next(): void {
    this.go(this.stop.current + 1);
  }

  previous(): void {
    this.go(this.stop.current - 1);
  }

  /** Stop any move in progress. */
  dispose(): void {
    this.halt?.();
    this.halt = undefined;
  }

  private go(index: number): void {
    const { camera, route, extentOf, fitPadding, isMotionReduced } = this.options;
    const target = route.stops[index];
    if (target === undefined) {
      return;
    }
    const frame = this.options.frame ?? requestAnimationFrame;
    const view = this.options.view();
    const leg = this.legTo(index);
    const settle = camera.fitted(view, extentOf(target), fitPadding);
    this.halt?.();
    this.stop.set(index);
    if (isMotionReduced()) {
      camera.set(settle);
      return;
    }
    const walkZoom = Math.min(view.width, view.height) / WALK_SPAN_CM;
    const walkMs = Math.min(MOST_WALK_MS, Math.max(LEAST_WALK_MS, pathLength(leg) * MS_PER_CM));
    const start = centredOn(leg[0]!, walkZoom, view);
    // Three moves in turn, each only if the one before arrived.
    this.halt = glide(camera, start, view, APPROACH_MS, frame, (arrived) => {
      if (!arrived) {
        return;
      }
      this.halt = glideAlong(camera, leg, walkZoom, view, walkMs, frame, (walked) => {
        if (walked) {
          this.halt = glide(camera, settle, view, SETTLE_MS, frame);
        }
      });
    });
  }

  // The path from where the walk stands to the stop asked for: from the
  // entrance before it has begun, backwards when going back.
  private legTo(index: number): Point[] {
    const { path, stops } = this.options.route;
    const from = this.stop.current;
    const to = stops[index]!.at;
    if (from < 0) {
      return path.slice(0, to + 1);
    }
    const at = stops[from]!.at;
    return at <= to ? path.slice(at, to + 1) : path.slice(to, at + 1).reverse();
  }
}
