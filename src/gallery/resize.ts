/**
 * ─ Resize ─
 *
 * A room resized by one of its walls, on the metre grid: which wall a
 * point is near, how far that wall may go before the room is under a
 * metre or meets another room, and the room's cells with the wall on
 * a given grid line. Pure, so the drag's arithmetic is tested without
 * a browser; the tool only paces it.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import type { Point, WorldRect } from "../geometry.js";
import { roomAt, type HungRoom, type Plan, type Side } from "./hang.js";
import type { Cells, Room } from "./works.js";

export interface WallHit {
  readonly room: HungRoom;
  readonly side: Side;
}

/** The grid lines a wall may sit on, both ends included. */
export interface Limits {
  readonly min: number;
  readonly max: number;
}

const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];

/** The wall nearest `point` within `reachCm`; on a shared wall, the room the point is in. */
export function wallNear(plan: Plan, point: Point, reachCm: number): WallHit | undefined {
  const within = roomAt(plan, point);
  let best:
    | { readonly hit: WallHit; readonly distance: number; readonly isInside: boolean }
    | undefined;
  for (const room of plan.rooms) {
    const isInside = room === within;
    for (const side of SIDES) {
      const distance = distanceToSide(room.rect, side, point);
      if (distance > reachCm) {
        continue;
      }
      const isNearer =
        best === undefined ||
        distance < best.distance ||
        (distance === best.distance && isInside && !best.isInside);
      if (isNearer) {
        best = { hit: { room, side }, distance, isInside };
      }
    }
  }
  return best?.hit;
}

// How far a point is from one side of a rect: straight across to it, or to its nearer end.
function distanceToSide(rect: WorldRect, side: Side, point: Point): number {
  if (side === "left" || side === "right") {
    const x = side === "left" ? rect.left : rect.right;
    const dy = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
    return Math.hypot(point.x - x, dy);
  }
  const y = side === "top" ? rect.top : rect.bottom;
  const dx = Math.max(rect.left - point.x, 0, point.x - rect.right);
  return Math.hypot(dx, point.y - y);
}

/** A room's place on the grid, as cells. */
export function cellsOf(room: Room): Cells {
  const { column, row, columns, rows } = room;
  return { column, row, columns, rows };
}

/** The grid line `side` of `cells` sits on. */
export function lineOf(cells: Cells, side: Side): number {
  switch (side) {
    case "left":
      return cells.column;
    case "right":
      return cells.column + cells.columns;
    case "top":
      return cells.row;
    case "bottom":
      return cells.row + cells.rows;
  }
}

/**
 * How far `side` may move, in grid lines: the room keeps a metre, and the
 * wall stops at the first of `others` in its way. No room in the way, no
 * limit that way.
 */
export function limitsOf(cells: Cells, side: Side, others: readonly Cells[]): Limits {
  const right = cells.column + cells.columns;
  const bottom = cells.row + cells.rows;
  // Only a room across from the wall can be in its way.
  const acrossRows = others.filter((o) => o.row < bottom && o.row + o.rows > cells.row);
  const acrossColumns = others.filter(
    (o) => o.column < right && o.column + o.columns > cells.column
  );
  switch (side) {
    case "left":
      return {
        min: Math.max(
          ...acrossRows
            .filter((o) => o.column + o.columns <= cells.column)
            .map((o) => o.column + o.columns)
        ),
        max: right - 1,
      };
    case "right":
      return {
        min: cells.column + 1,
        max: Math.min(...acrossRows.filter((o) => o.column >= right).map((o) => o.column)),
      };
    case "top":
      return {
        min: Math.max(
          ...acrossColumns.filter((o) => o.row + o.rows <= cells.row).map((o) => o.row + o.rows)
        ),
        max: bottom - 1,
      };
    case "bottom":
      return {
        min: cells.row + 1,
        max: Math.min(...acrossColumns.filter((o) => o.row >= bottom).map((o) => o.row)),
      };
  }
}

/** `line` held within `limits`. */
export function clamped(line: number, limits: Limits): number {
  return Math.min(limits.max, Math.max(limits.min, line));
}

/** `cells` with `side` on grid line `line`; a line with a fraction is a wall between lines, for a preview. */
export function withSide(cells: Cells, side: Side, line: number): Cells {
  switch (side) {
    case "left":
      return { ...cells, column: line, columns: cells.column + cells.columns - line };
    case "right":
      return { ...cells, columns: line - cells.column };
    case "top":
      return { ...cells, row: line, rows: cells.row + cells.rows - line };
    case "bottom":
      return { ...cells, rows: line - cells.row };
  }
}
