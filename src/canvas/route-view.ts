/**
 * ─ Route view ─
 *
 * The walk drawn on the floor, the way a museum map suggests a path:
 * one smooth line through the route's points, in the accent. It
 * belongs to the plan view, so it fades as the zoom rises and is gone
 * by the time a room fills the screen.
 * Decision: DECISIONS.md, a route through the rooms.
 */

import { Graphics } from "pixi.js";
import type { Point } from "../geometry.js";
import type { Route } from "../gallery/route.js";
import type { PackedColor } from "./css-color.js";

// The line's width on the floor, in centimetres.
const WIDTH_CM = 6;
// Fully shown at the first zoom and below, gone at the second and above.
const SHOWN_ZOOM = 0.5;
const GONE_ZOOM = 1.2;

/** The route as a line on the floor, fading with the zoom. */
export class RouteView {
  readonly line: Graphics;

  constructor(route: Route, color: PackedColor) {
    this.line = drawSmooth(route.path, color);
  }

  follow(zoom: number): void {
    this.line.alpha = Math.min(1, Math.max(0, (GONE_ZOOM - zoom) / (GONE_ZOOM - SHOWN_ZOOM)));
  }

  destroy(): void {
    this.line.destroy();
  }
}

// A curve through the points: each corner is rounded by curving to the
// midpoint of the next stretch, so the walk reads as a stroll, not a survey.
function drawSmooth(path: readonly Point[], color: PackedColor): Graphics {
  const shapes = new Graphics({ label: "route" });
  const first = path[0];
  if (first === undefined) {
    return shapes;
  }
  shapes.moveTo(first.x, first.y);
  for (let i = 1; i < path.length - 1; i += 1) {
    const corner = path[i]!;
    const next = path[i + 1]!;
    shapes.quadraticCurveTo(corner.x, corner.y, (corner.x + next.x) / 2, (corner.y + next.y) / 2);
  }
  const last = path[path.length - 1]!;
  shapes.lineTo(last.x, last.y);
  shapes.stroke({
    color: color.rgb,
    alpha: color.alpha,
    width: WIDTH_CM,
    cap: "round",
    join: "round",
  });
  return shapes;
}
