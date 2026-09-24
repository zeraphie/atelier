/**
 * ─ Hanging ─
 *
 * Works on walls. Works hang the wall facing the entry first, so the
 * first thing seen through a threshold is a work on the far wall, then
 * the two walls beside it, then the entry wall; on each, the longest
 * stretch no doorway breaks, the works centred on it and standing off
 * the wall a little, and the doorways' stretches stay clear. A work
 * that names its wall hangs there. A work placed by hand skips the
 * walls and sits at its point; one no wall has room for sits at the
 * room's centre rather than failing the build.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import { centre, distance, type Point, type Segment, type WorldRect } from "../../geometry.js";
import type { Doorway, HungWork, Spacing } from "./hang.js";
import { edges, longestFree, onWall, shrink } from "./wall-math.js";
import type { Room, Side, Work } from "../works.js";

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** The room's works hung on its walls, entry first, in the order a walk meets them; the placed ones at their points. */
export function hangWorks(
  room: Room,
  rect: WorldRect,
  entry: Side,
  doorways: readonly Doorway[],
  spacing: Spacing,
  placed: Readonly<Record<string, Point>>
): HungWork[] {
  const sides = edges(rect);
  const order: Side[] = [OPPOSITE[entry], ...beside(entry), entry];
  const hung: HungWork[] = [];
  const unhung: Work[] = [];
  const toHang = room.works.filter((work) => placed[work.id] === undefined);
  const stretchOf = (side: Side): Segment => {
    const gaps = doorways.map((d) => d.gap).filter((gap) => onWall(sides[side], gap));
    return shrink(longestFree(sides[side], gaps), spacing.endMarginCm);
  };
  const measureOf = (side: Side) => (side === "top" || side === "bottom" ? "width" : "height");
  for (const side of order) {
    const named = toHang.filter((work) => work.wall === side);
    if (named.length === 0) {
      continue;
    }
    const stretch = stretchOf(side);
    const taken = takeThatFit(
      named,
      measureOf(side),
      distance(stretch.a, stretch.b),
      spacing.gapCm
    );
    unhung.push(...named.slice(taken.length));
    hung.push(...place(taken, side, stretch, rect, spacing));
  }
  let remaining = toHang.filter((work) => work.wall === undefined);
  for (const side of order) {
    if (remaining.length === 0) {
      break;
    }
    if (hung.some((h) => h.wall === side)) {
      continue;
    }
    const stretch = stretchOf(side);
    const taken = takeThatFit(
      remaining,
      measureOf(side),
      distance(stretch.a, stretch.b),
      spacing.gapCm
    );
    remaining = remaining.slice(taken.length);
    hung.push(...place(taken, side, stretch, rect, spacing));
  }
  unhung.push(...remaining);
  const middle = centre(rect);
  return [
    // In the order a walk meets them: wall by wall, the far wall first.
    ...order.flatMap((side) => hung.filter((h) => h.wall === side)),
    ...unhung.map((work) => centredOn(work, middle)),
    ...room.works
      .filter((work) => placed[work.id] !== undefined)
      .map((work) => centredOn(work, placed[work.id]!)),
  ];
}

// A work with its centre on a point, on no wall.
function centredOn(work: Work, point: Point): HungWork {
  return {
    work,
    rect: {
      left: point.x - work.widthCm / 2,
      top: point.y - work.heightCm / 2,
      right: point.x + work.widthCm / 2,
      bottom: point.y + work.heightCm / 2,
    },
  };
}

function beside(side: Side): Side[] {
  return side === "top" || side === "bottom" ? ["left", "right"] : ["top", "bottom"];
}

// As many works as fit along `length`, in order, with gaps between.
function takeThatFit(
  works: readonly Work[],
  measure: "width" | "height",
  length: number,
  gap: number
): Work[] {
  const taken: Work[] = [];
  let used = 0;
  for (const work of works) {
    const size = measure === "width" ? work.widthCm : work.heightCm;
    const next = used + (taken.length > 0 ? gap : 0) + size;
    if (next > length) {
      break;
    }
    taken.push(work);
    used = next;
  }
  return taken;
}

// The works centred along their stretch of wall, standing off it a little.
function place(
  works: readonly Work[],
  side: Side,
  stretch: Segment,
  rect: WorldRect,
  spacing: Spacing
): HungWork[] {
  const isHorizontal = side === "top" || side === "bottom";
  const sizes = works.map((work) => (isHorizontal ? work.widthCm : work.heightCm));
  const total =
    sizes.reduce((sum, s) => sum + s, 0) + spacing.gapCm * Math.max(0, works.length - 1);
  const from = isHorizontal
    ? Math.min(stretch.a.x, stretch.b.x)
    : Math.min(stretch.a.y, stretch.b.y);
  let at = from + (distance(stretch.a, stretch.b) - total) / 2;
  return works.map((work) => {
    let hungRect: WorldRect;
    if (side === "top") {
      const top = rect.top + spacing.headroomCm + spacing.standoffCm;
      hungRect = { left: at, top, right: at + work.widthCm, bottom: top + work.heightCm };
    } else if (side === "bottom") {
      const bottom = rect.bottom - spacing.standoffCm;
      hungRect = { left: at, top: bottom - work.heightCm, right: at + work.widthCm, bottom };
    } else if (side === "left") {
      const left = rect.left + spacing.standoffCm;
      hungRect = { left, top: at, right: left + work.widthCm, bottom: at + work.heightCm };
    } else {
      const right = rect.right - spacing.standoffCm;
      hungRect = { left: right - work.widthCm, top: at, right, bottom: at + work.heightCm };
    }
    at += (isHorizontal ? work.widthCm : work.heightCm) + spacing.gapCm;
    return { work, rect: hungRect, wall: side };
  });
}
