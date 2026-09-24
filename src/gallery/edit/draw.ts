/**
 * ─ Draw ─
 *
 * A room drawn on the grid by a drag: the cell a point is in, the
 * whole-metre span between the cell the drag began in and the cell
 * the pointer is in, and whether a span lies over any room already
 * there. Pure, so the tool only paces it.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import type { Point } from "../../geometry.js";
import type { Cells } from "../works.js";

export interface Cell {
  readonly column: number;
  readonly row: number;
}

/** The grid cell `point` is in, `unitCm` to a cell. */
export function cellAt(point: Point, unitCm: number): Cell {
  return { column: Math.floor(point.x / unitCm), row: Math.floor(point.y / unitCm) };
}

export function isSameCell(a: Cell, b: Cell): boolean {
  return a.column === b.column && a.row === b.row;
}

/** The cells from `from` to `to`, both included, whichever way the drag went. */
export function spanOf(from: Cell, to: Cell): Cells {
  return {
    column: Math.min(from.column, to.column),
    row: Math.min(from.row, to.row),
    columns: Math.abs(to.column - from.column) + 1,
    rows: Math.abs(to.row - from.row) + 1,
  };
}

/** Whether `cells` lie over any of `others`, even by one cell. */
export function overlaps(cells: Cells, others: readonly Cells[]): boolean {
  return others.some(
    (other) =>
      other.column < cells.column + cells.columns &&
      other.column + other.columns > cells.column &&
      other.row < cells.row + cells.rows &&
      other.row + other.rows > cells.row
  );
}
