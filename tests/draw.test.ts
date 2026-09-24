import { describe, expect, test } from "bun:test";
import { cellAt, isSameCell, overlaps, spanOf } from "../src/gallery/edit/draw.js";
import type { Cells } from "../src/gallery/works.js";

describe("cellAt", () => {
  test("the cell a point is in, the grid's lines belonging to the cell after them", () => {
    expect(cellAt({ x: 150, y: 250 }, 100)).toEqual({ column: 1, row: 2 });
    expect(cellAt({ x: 200, y: 0 }, 100)).toEqual({ column: 2, row: 0 });
    expect(cellAt({ x: -1, y: -150 }, 100)).toEqual({ column: -1, row: -2 });
    expect(isSameCell({ column: 1, row: 2 }, cellAt({ x: 199, y: 299 }, 100))).toBe(true);
  });
});

describe("spanOf", () => {
  test("both cells included, whichever way the drag went", () => {
    expect(spanOf({ column: 2, row: 3 }, { column: 4, row: 4 })).toEqual({
      column: 2,
      row: 3,
      columns: 3,
      rows: 2,
    });
    expect(spanOf({ column: 4, row: 4 }, { column: 2, row: 3 })).toEqual({
      column: 2,
      row: 3,
      columns: 3,
      rows: 2,
    });
    expect(spanOf({ column: 1, row: 1 }, { column: 1, row: 1 })).toEqual({
      column: 1,
      row: 1,
      columns: 1,
      rows: 1,
    });
  });
});

describe("overlaps", () => {
  const rooms: Cells[] = [
    { column: 0, row: 0, columns: 3, rows: 2 },
    { column: 3, row: 0, columns: 2, rows: 2 },
  ];

  test("a span over any cell of a room overlaps; one that only touches a wall does not", () => {
    expect(overlaps({ column: 2, row: 1, columns: 2, rows: 2 }, rooms)).toBe(true);
    expect(overlaps({ column: 0, row: 2, columns: 5, rows: 1 }, rooms)).toBe(false);
    expect(overlaps({ column: 5, row: 0, columns: 1, rows: 2 }, rooms)).toBe(false);
    expect(overlaps({ column: 4, row: 1, columns: 1, rows: 1 }, rooms)).toBe(true);
  });
});
