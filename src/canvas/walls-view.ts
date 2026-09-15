/**
 * ─ Walls view ─
 *
 * The plan's walls as one drawing: every stretch the hang left after
 * cutting the doorways, in ink, as thick as the plan says. Walls are
 * things in the world, so they thicken as the zoom rises; square caps
 * close the corners where two meet.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { Graphics } from "pixi.js";
import type { Segment } from "../gallery/hang.js";
import type { PackedColor } from "./css-color.js";

/** Draw `walls`, `thickness` centimetres wide, into a graphics object. */
export function drawWalls(
  walls: readonly Segment[],
  thickness: number,
  color: PackedColor
): Graphics {
  const shapes = new Graphics({ label: "walls" });
  for (const wall of walls) {
    shapes.moveTo(wall.a.x, wall.a.y).lineTo(wall.b.x, wall.b.y);
  }
  shapes.stroke({ color: color.rgb, alpha: color.alpha, width: thickness, cap: "square" });
  return shapes;
}
