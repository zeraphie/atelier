/**
 * ─ Scale ─
 *
 * A picture of your own resized by a corner: which corner of which
 * picture a point is near, and the rect the picture takes when that
 * corner follows the pointer with the opposite corner held still and
 * the proportions kept. Pure; the scale tool paces it.
 * Decision: DECISIONS.md, a picture and its hanging are two things.
 */

import type { Point, WorldRect } from "../geometry.js";
import type { HungWork, Plan } from "./hang.js";

export type Corner = "nw" | "ne" | "sw" | "se";

export interface CornerHit {
  readonly work: HungWork;
  readonly corner: Corner;
}

/** A corner is the nearest this fraction of the picture's shorter side, so its middle always moves it. */
const CORNER_SHARE = 0.25;

const CORNERS: readonly Corner[] = ["nw", "ne", "sw", "se"];

/** The corner of a picture of your own nearest `point`, within `reachCm` and the corner's own share of the picture. */
export function cornerNear(plan: Plan, point: Point, reachCm: number): CornerHit | undefined {
  let best: { readonly hit: CornerHit; readonly distance: number } | undefined;
  for (const room of plan.rooms) {
    for (const work of room.works) {
      if (work.work.pictureId === undefined) {
        continue;
      }
      const { rect } = work;
      const reach = Math.min(
        reachCm,
        CORNER_SHARE * Math.min(rect.right - rect.left, rect.bottom - rect.top)
      );
      for (const corner of CORNERS) {
        const at = cornerPoint(rect, corner);
        const distance = Math.hypot(point.x - at.x, point.y - at.y);
        if (distance <= reach && (best === undefined || distance < best.distance)) {
          best = { hit: { work, corner }, distance };
        }
      }
    }
  }
  return best?.hit;
}

/** Where a corner of `rect` is. */
export function cornerPoint(rect: WorldRect, corner: Corner): Point {
  return {
    x: corner === "nw" || corner === "sw" ? rect.left : rect.right,
    y: corner === "nw" || corner === "ne" ? rect.top : rect.bottom,
  };
}

const OPPOSITE: Record<Corner, Corner> = { nw: "se", ne: "sw", sw: "ne", se: "nw" };

/**
 * `rect` with `corner` drawn towards `to`, the opposite corner held still and
 * the proportions kept: the picture grows to whichever of its width and
 * height the pointer asks more of, and never under `minWidthCm` wide.
 */
export function scaled(rect: WorldRect, corner: Corner, to: Point, minWidthCm: number): WorldRect {
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  const anchor = cornerPoint(rect, OPPOSITE[corner]);
  // How far the pointer is from the anchor the way the corner lies; past the anchor is nothing.
  const across = corner === "ne" || corner === "se" ? to.x - anchor.x : anchor.x - to.x;
  const down = corner === "sw" || corner === "se" ? to.y - anchor.y : anchor.y - to.y;
  const share = Math.max(0, across / width, down / height);
  const newWidth = Math.max(minWidthCm, width * share);
  const newHeight = (newWidth * height) / width;
  const left = corner === "nw" || corner === "sw" ? anchor.x - newWidth : anchor.x;
  const top = corner === "nw" || corner === "ne" ? anchor.y - newHeight : anchor.y;
  return { left, top, right: left + newWidth, bottom: top + newHeight };
}
