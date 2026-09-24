/**
 * ─ Wall math ─
 *
 * A room's walls as the four edges of its rect, and what a doorway does
 * to one: which wall a gap lies on, the pieces a gap leaves, the longest
 * piece between gaps, and a stretch shortened at its ends or widened
 * for the wall's caps. Pure, in world units, and the ground the
 * doorways and the hanging both stand on.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import {
  along,
  centre,
  distance,
  type Point,
  type Segment,
  type WorldRect,
} from "../../geometry.js";
import type { Side } from "../works.js";

/** A rect's four walls, by side, each running left to right or top to bottom. */
export function edges(rect: WorldRect): Record<Side, Segment> {
  return {
    top: { a: { x: rect.left, y: rect.top }, b: { x: rect.right, y: rect.top } },
    right: { a: { x: rect.right, y: rect.top }, b: { x: rect.right, y: rect.bottom } },
    bottom: { a: { x: rect.left, y: rect.bottom }, b: { x: rect.right, y: rect.bottom } },
    left: { a: { x: rect.left, y: rect.top }, b: { x: rect.left, y: rect.bottom } },
  };
}

/** Which of a rect's walls a gap lies on. */
export function sideOf(rect: WorldRect, gap: Segment): Side {
  const sides = edges(rect);
  const found = (Object.keys(sides) as Side[]).find((side) => onWall(sides[side], gap));
  if (found === undefined) {
    throw new Error("a doorway lies on none of its room's walls");
  }
  return found;
}

/** Whether `gap` lies along `wall`, within its ends. */
export function onWall(wall: Segment, gap: Segment): boolean {
  if (wall.a.x === wall.b.x) {
    return (
      gap.a.x === wall.a.x && gap.b.x === wall.a.x && gap.a.y >= wall.a.y && gap.b.y <= wall.b.y
    );
  }
  return gap.a.y === wall.a.y && gap.b.y === wall.a.y && gap.a.x >= wall.a.x && gap.b.x <= wall.b.x;
}

/** The longest piece of a wall between its doorways; a wall that is all doorway has its midpoint, where nothing fits. */
export function longestFree(wall: Segment, gaps: readonly Segment[]): Segment {
  let pieces = [wall];
  for (const gap of gaps) {
    pieces = pieces.flatMap((piece) => cut(piece, gap));
  }
  const longest = pieces.reduce<Segment | undefined>(
    (best, piece) =>
      best === undefined || distance(piece.a, piece.b) > distance(best.a, best.b) ? piece : best,
    undefined
  );
  return longest ?? { a: centre(wall), b: centre(wall) };
}

/** A segment with a gap taken out of it, when the gap lies along it; the segment whole otherwise. */
export function cut(segment: Segment, gap: Segment): Segment[] {
  const isVertical = segment.a.x === segment.b.x;
  const onLine = isVertical
    ? gap.a.x === segment.a.x && gap.b.x === segment.a.x
    : gap.a.y === segment.a.y && gap.b.y === segment.a.y;
  if (!onLine) {
    return [segment];
  }
  const at = (p: Point) => (isVertical ? p.y : p.x);
  const point = (v: number): Point =>
    isVertical ? { x: segment.a.x, y: v } : { x: v, y: segment.a.y };
  const start = Math.min(at(segment.a), at(segment.b));
  const end = Math.max(at(segment.a), at(segment.b));
  const gapStart = Math.max(start, Math.min(at(gap.a), at(gap.b)));
  const gapEnd = Math.min(end, Math.max(at(gap.a), at(gap.b)));
  if (gapEnd <= gapStart) {
    return [segment];
  }
  const pieces: Segment[] = [];
  if (gapStart > start) {
    pieces.push({ a: point(start), b: point(gapStart) });
  }
  if (gapEnd < end) {
    pieces.push({ a: point(gapEnd), b: point(end) });
  }
  return pieces;
}

/** A segment `by` shorter at both ends, or its midpoint when too short for that. */
export function shrink(segment: Segment, by: number): Segment {
  const total = distance(segment.a, segment.b);
  if (total <= 2 * by) {
    const mid = along(segment, total / 2);
    return { a: mid, b: mid };
  }
  return { a: along(segment, by), b: along(segment, total - by) };
}

/** A gap `by` longer, half at each end, for the caps of the wall on either side. */
export function widen(gap: Segment, by: number): Segment {
  const dx = Math.sign(gap.b.x - gap.a.x) * (by / 2);
  const dy = Math.sign(gap.b.y - gap.a.y) * (by / 2);
  return { a: { x: gap.a.x - dx, y: gap.a.y - dy }, b: { x: gap.b.x + dx, y: gap.b.y + dy } };
}
