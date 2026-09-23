/**
 * ─ Edges ─
 *
 * A metre edge of the plan's grid has one name: the cell on its west
 * or north side, and which of that cell's sides it is. A doorway sits
 * on one, so two rooms that share a wall find the same doorway under
 * the same name, whichever side of it they are. Borrowed as an idea
 * from tablewright's topology.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import type { Point } from "../geometry.js";
import type { Segment } from "./hang.js";

export interface Edge {
  readonly col: number;
  readonly row: number;
  /** The cell's east edge runs down its right side; its south edge along its bottom. */
  readonly side: "east" | "south";
}

/** The key an edge is stored under. */
export function edgeKey(edge: Edge): string {
  return `${edge.side}:${edge.col}:${edge.row}`;
}

/** The key a doorway between two rooms is stored under, in tour order. */
export function pairKey(from: string, to: string): string {
  return `${from}>${to}`;
}

/** The edge as a segment in world units, `unitCm` to a cell. */
export function edgeSegment(edge: Edge, unitCm: number): Segment {
  const x = edge.col * unitCm;
  const y = edge.row * unitCm;
  return edge.side === "east"
    ? { a: { x: x + unitCm, y }, b: { x: x + unitCm, y: y + unitCm } }
    : { a: { x, y: y + unitCm }, b: { x: x + unitCm, y: y + unitCm } };
}

/** Whether the edge lies along `wall`, a segment on the grid, within its ends. */
export function edgeOnWall(wall: Segment, edge: Edge, unitCm: number): boolean {
  const { a, b } = edgeSegment(edge, unitCm);
  const isVertical = wall.a.x === wall.b.x;
  if (isVertical) {
    const top = Math.min(wall.a.y, wall.b.y);
    const bottom = Math.max(wall.a.y, wall.b.y);
    return a.x === wall.a.x && b.x === wall.a.x && a.y >= top && b.y <= bottom;
  }
  const left = Math.min(wall.a.x, wall.b.x);
  const right = Math.max(wall.a.x, wall.b.x);
  return a.y === wall.a.y && b.y === wall.a.y && a.x >= left && b.x <= right;
}

/** The edge nearest `point`, within `reachCm` of it; none when the point is nowhere near a line. */
export function edgeNear(point: Point, unitCm: number, reachCm: number): Edge | undefined {
  const col = Math.floor(point.x / unitCm);
  const row = Math.floor(point.y / unitCm);
  // Distances to the nearest vertical and horizontal grid lines.
  const toVertical = Math.abs(point.x - Math.round(point.x / unitCm) * unitCm);
  const toHorizontal = Math.abs(point.y - Math.round(point.y / unitCm) * unitCm);
  if (Math.min(toVertical, toHorizontal) > reachCm) {
    return undefined;
  }
  if (toVertical <= toHorizontal) {
    const line = Math.round(point.x / unitCm);
    return { col: line - 1, row, side: "east" };
  }
  const line = Math.round(point.y / unitCm);
  return { col, row: line - 1, side: "south" };
}
