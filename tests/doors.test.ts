import { describe, expect, test } from "bun:test";
import { doorAt, doorwayOnEdge, pairAt } from "../src/gallery/doors.js";
import { hangGallery, type Spacing } from "../src/gallery/hang.js";
import type { Room } from "../src/gallery/works.js";

const spacing: Spacing = {
  unitCm: 100,
  gapCm: 10,
  standoffCm: 5,
  endMarginCm: 20,
  headroomCm: 10,
  wallCm: 4,
  doorCm: 20,
};

function room(id: string, column: number, row: number, columns: number, rows: number): Room {
  return { id, name: id, column, row, columns, rows, works: [] };
}

// a and b side by side, sharing x = 300 for y 0..200; c drawn under both.
const plan = hangGallery(
  [room("a", 0, 0, 3, 2), room("b", 3, 0, 2, 2), { ...room("c", 0, 2, 5, 2), drawn: true }],
  spacing
);

describe("pairAt", () => {
  test("the two rooms an edge stands between, in the plan's order", () => {
    expect(pairAt(plan, { col: 2, row: 0, side: "east" }, 100)).toEqual({
      key: "a>b",
      from: "a",
      to: "b",
    });
    expect(pairAt(plan, { col: 4, row: 1, side: "south" }, 100)).toEqual({
      key: "b>c",
      from: "b",
      to: "c",
    });
  });

  test("an outer wall, or an edge inside a room, is no pair", () => {
    expect(pairAt(plan, { col: -1, row: 0, side: "east" }, 100)).toBeUndefined();
    expect(pairAt(plan, { col: 0, row: 0, side: "east" }, 100)).toBeUndefined();
    expect(pairAt(plan, { col: 0, row: 3, side: "south" }, 100)).toBeUndefined();
  });
});

describe("doorAt", () => {
  const ab = plan.doorways.find((d) => d.from === "a" && d.to === "b")!;
  const row = Math.floor((ab.gap.a.y + ab.gap.b.y) / 2 / 100);

  test("a doorway sits on the edge its middle is in", () => {
    expect(doorwayOnEdge(ab, { col: 2, row, side: "east" }, 100)).toBe(true);
    expect(doorwayOnEdge(ab, { col: 2, row: 1 - row, side: "east" }, 100)).toBe(false);
    expect(doorwayOnEdge(ab, { col: 2, row, side: "south" }, 100)).toBe(false);
  });

  test("a click on the doorway takes it away; on another edge of the wall, puts it there", () => {
    expect(doorAt(plan, { col: 2, row, side: "east" }, 100)).toEqual({
      edge: { col: 2, row, side: "east" },
      pair: { key: "a>b", from: "a", to: "b" },
      isThere: true,
    });
    expect(doorAt(plan, { col: 2, row: 1 - row, side: "east" }, 100)?.isThere).toBe(false);
    expect(doorAt(plan, { col: 0, row: 0, side: "east" }, 100)).toBeUndefined();
  });
});
