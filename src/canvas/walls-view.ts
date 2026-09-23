/**
 * ─ Walls view ─
 *
 * The plan's walls as one drawing: every stretch the hang left after
 * cutting the doorways, in ink, as thick as the plan says. Walls are
 * things in the world, so they thicken as the zoom rises; square caps
 * close the corners where two meet, and a post across the wall at each
 * end of a doorway makes the opening firm. Drawn into a graphics object
 * the layer keeps, so a preview draws them again in place.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import type { Graphics } from "pixi.js";
import type { Segment } from "../geometry.js";
import type { Doorway } from "../gallery/hang.js";
import type { PackedColor } from "./css-color.js";

// A door post, as multiples of the wall's thickness: how far it reaches across, and how thick along.
const POST_ACROSS = 2.25;
const POST_ALONG = 0.375;

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

/** Add a post across the wall at both ends of every doorway, over walls already drawn into `shapes`. */
export function drawPosts(
  shapes: Graphics,
  doorways: readonly Doorway[],
  thickness: number,
  color: PackedColor
): void {
  const across = thickness * POST_ACROSS;
  const along = thickness * POST_ALONG;
  for (const { gap } of doorways) {
    const isVertical = gap.a.x === gap.b.x;
    for (const end of [gap.a, gap.b]) {
      if (isVertical) {
        shapes.rect(end.x - across / 2, end.y - along / 2, across, along);
      } else {
        shapes.rect(end.x - along / 2, end.y - across / 2, along, across);
      }
    }
  }
  shapes.fill({ color: color.rgb, alpha: color.alpha });
}
