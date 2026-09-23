/**
 * ─ Walls view ─
 *
 * The plan's walls as one drawing: every stretch the hang left after
 * cutting the doorways, in ink, as thick as the plan says. Walls are
 * things in the world, so they thicken as the zoom rises; square caps
 * close the corners where two meet. Drawn into a graphics object the
 * layer keeps, so a preview draws them again in place.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import type { Graphics } from "pixi.js";
import type { Segment } from "../gallery/hang.js";
import type { PackedColor } from "./css-color.js";

/** Draw `walls` into `shapes` in place of what was there, `thickness` centimetres wide. */
export function drawWalls(
  shapes: Graphics,
  walls: readonly Segment[],
  thickness: number,
  color: PackedColor
): void {
  shapes.clear();
  for (const wall of walls) {
    shapes.moveTo(wall.a.x, wall.a.y).lineTo(wall.b.x, wall.b.y);
  }
  shapes.stroke({ color: color.rgb, alpha: color.alpha, width: thickness, cap: "square" });
}
