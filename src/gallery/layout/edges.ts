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

import type { Point, WorldRect } from "../../geometry.js";
import type { Segment } from "../../geometry.js";

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

/**
 * The edges within `reachCm` of `point`, nearest first: one for every
 * vertical and every horizontal grid line within reach, in the cell the
 * point is in, so a caller can take the first that is on a wall even
 * when a nearer line is on none.
 */
export function edgesNear(point: Point, unitCm: number, reachCm: number): Edge[] {
  const col = Math.floor(point.x / unitCm);
  const row = Math.floor(point.y / unitCm);
  const candidates: { readonly edge: Edge; readonly distance: number }[] = [];
  const first = (at: number): number => Math.ceil((at - reachCm) / unitCm);
  const last = (at: number): number => Math.floor((at + reachCm) / unitCm);
  for (let line = first(point.x); line <= last(point.x); line += 1) {
    candidates.push({
      edge: { col: line - 1, row, side: "east" },
      distance: Math.abs(point.x - line * unitCm),
    });
  }
  for (let line = first(point.y); line <= last(point.y); line += 1) {
    candidates.push({
      edge: { col, row: line - 1, side: "south" },
      distance: Math.abs(point.y - line * unitCm),
    });
  }
  return candidates.sort((a, b) => a.distance - b.distance).map((candidate) => candidate.edge);
}

/** The edge nearest `point`, within `reachCm` of it; none when the point is nowhere near a line. */
export function edgeNear(point: Point, unitCm: number, reachCm: number): Edge | undefined {
  return edgesNear(point, unitCm, reachCm)[0];
}

/** Whether the edge lies along one of `rect`'s sides, within its ends. */
export function edgeOnRect(rect: WorldRect, edge: Edge, unitCm: number): boolean {
  const { a, b } = edgeSegment(edge, unitCm);
  if (a.x === b.x) {
    return (a.x === rect.left || a.x === rect.right) && a.y >= rect.top && b.y <= rect.bottom;
  }
  return (a.y === rect.top || a.y === rect.bottom) && a.x >= rect.left && b.x <= rect.right;
}
