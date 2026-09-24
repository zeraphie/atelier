import { describe, expect, test } from "bun:test";
import { hangGallery, rectOf, type Spacing } from "../../../src/gallery/layout/hang.js";
import { clamped, lineOf, limitsOf, wallNear, withSide } from "../../../src/gallery/edit/resize.js";
import type { Cells, Room } from "../../../src/gallery/works.js";

const spacing: Spacing = {
  unitCm: 100,
  gapCm: 10,
  standoffCm: 5,
  endMarginCm: 20,
  headroomCm: 10,
  wallCm: 4,
  doorCm: 20,
};

function room(id: string, cells: Cells): Room {
  return { id, name: id, ...cells, works: [] };
}

// Two rooms side by side sharing the line x = 3, and one below the first.
const a: Cells = { column: 0, row: 0, columns: 3, rows: 2 };
const b: Cells = { column: 3, row: 0, columns: 2, rows: 2 };
const c: Cells = { column: 0, row: 2, columns: 2, rows: 2 };
const plan = hangGallery([room("a", a), room("b", b), room("c", c)], spacing);

describe("wallNear", () => {
  test("the wall of the room the point is in, when it is within reach", () => {
    expect(wallNear(plan, { x: 295, y: 100 }, 8)?.side).toBe("right");
    expect(wallNear(plan, { x: 295, y: 100 }, 8)?.room.room.id).toBe("a");
    expect(wallNear(plan, { x: 150, y: 100 }, 8)).toBeUndefined();
  });

  test("a shared wall belongs to the room the point is in", () => {
    expect(wallNear(plan, { x: 302, y: 100 }, 8)?.room.room.id).toBe("b");
    expect(wallNear(plan, { x: 302, y: 100 }, 8)?.side).toBe("left");
  });

  test("outside every room, the nearest wall within reach", () => {
    const hit = wallNear(plan, { x: 400, y: 205 }, 8);
    expect(hit?.room.room.id).toBe("b");
    expect(hit?.side).toBe("bottom");
    expect(wallNear(plan, { x: 400, y: 260 }, 8)).toBeUndefined();
  });

  test("near a corner, the nearer of the two walls", () => {
    expect(wallNear(plan, { x: 3, y: 6 }, 8)?.side).toBe("left");
    expect(wallNear(plan, { x: 6, y: 3 }, 8)?.side).toBe("top");
  });
});

describe("limitsOf", () => {
  test("a wall keeps the room a metre wide and stops at the room across from it", () => {
    expect(limitsOf(a, "right", [b, c])).toEqual({ min: 1, max: 3 });
    expect(limitsOf(b, "left", [a, c])).toEqual({ min: 3, max: 4 });
    expect(limitsOf(a, "bottom", [b, c])).toEqual({ min: 1, max: 2 });
    expect(limitsOf(c, "top", [a, b])).toEqual({ min: 2, max: 3 });
  });

  test("with no room in the way, no limit that way", () => {
    expect(limitsOf(a, "left", [b, c])).toEqual({ min: -Infinity, max: 2 });
    expect(limitsOf(b, "right", [a, c])).toEqual({ min: 4, max: Infinity });
    expect(limitsOf(c, "bottom", [a, b])).toEqual({ min: 3, max: Infinity });
  });

  test("a room not across from the wall does not stand in its way", () => {
    // c sits under a's left two metres only; b's bottom wall is clear of it.
    expect(limitsOf(b, "bottom", [a, c])).toEqual({ min: 1, max: Infinity });
    // A room a row below, beyond c's rows, blocks c and not a.
    const d: Cells = { column: 0, row: 5, columns: 3, rows: 1 };
    expect(limitsOf(c, "bottom", [a, b, d])).toEqual({ min: 3, max: 5 });
  });
});

describe("withSide and lineOf", () => {
  test("each side moves its own edge and leaves the opposite one", () => {
    expect(withSide(a, "right", 5)).toEqual({ column: 0, row: 0, columns: 5, rows: 2 });
    expect(withSide(a, "left", 1)).toEqual({ column: 1, row: 0, columns: 2, rows: 2 });
    expect(withSide(a, "top", -1)).toEqual({ column: 0, row: -1, columns: 3, rows: 3 });
    expect(withSide(a, "bottom", 4)).toEqual({ column: 0, row: 0, columns: 3, rows: 4 });
  });

  test("a wall between lines is a fraction of a cell, for a preview", () => {
    expect(withSide(a, "right", 3.4).columns).toBeCloseTo(3.4);
    expect(rectOf(withSide(a, "right", 3.4), 100).right).toBeCloseTo(340);
  });

  test("lineOf reads a side's line back", () => {
    expect(lineOf(b, "left")).toBe(3);
    expect(lineOf(b, "right")).toBe(5);
    expect(lineOf(c, "top")).toBe(2);
    expect(lineOf(c, "bottom")).toBe(4);
  });
});

describe("clamped", () => {
  test("a line is held within its limits, and an open limit holds nothing back", () => {
    expect(clamped(7, { min: 1, max: 3 })).toBe(3);
    expect(clamped(0, { min: 1, max: 3 })).toBe(1);
    expect(clamped(2.5, { min: 1, max: Infinity })).toBe(2.5);
  });
});
