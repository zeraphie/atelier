import { describe, expect, test } from "bun:test";
import { doorAt, doorwayOnEdge, pairAt } from "../src/gallery/doors.js";
import type { Edge } from "../src/gallery/edges.js";
import type { Segment } from "../src/geometry.js";
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

// The metre edge a doorway's gap sits on.
function edgeUnder(gap: Segment): Edge {
  const middle = { x: (gap.a.x + gap.b.x) / 2, y: (gap.a.y + gap.b.y) / 2 };
  return gap.a.x === gap.b.x
    ? { col: middle.x / 100 - 1, row: Math.floor(middle.y / 100), side: "east" }
    : { col: Math.floor(middle.x / 100), row: middle.y / 100 - 1, side: "south" };
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

describe("doorAt, on an outer wall", () => {
  test("a way outside, keyed by the room and the edge, or nothing on no wall", () => {
    expect(doorAt(plan, { col: 4, row: 0, side: "east" }, 100)).toEqual({
      edge: { col: 4, row: 0, side: "east" },
      pair: { key: "b>outside:east:4:0", from: "b", to: "outside" },
      isThere: false,
    });
    expect(doorAt(plan, { col: 0, row: 3, side: "east" }, 100)).toBeUndefined();
    expect(doorAt(plan, { col: 6, row: 6, side: "south" }, 100)).toBeUndefined();
  });

  test("the entrance is taken away under its own key, and a way outside under its edge's", () => {
    const entrance = plan.doorways[0]!;
    const edge = edgeUnder(entrance.gap);
    expect(doorAt(plan, edge, 100)).toEqual({
      edge,
      pair: { key: "outside>a", from: "outside", to: "a" },
      isThere: true,
    });
    const withWay = hangGallery([room("a", 0, 0, 3, 2), room("b", 3, 0, 2, 2)], spacing, {
      doorways: { "b>outside:east:4:0": { col: 4, row: 0, side: "east" } },
    });
    expect(doorAt(withWay, { col: 4, row: 0, side: "east" }, 100)).toEqual({
      edge: { col: 4, row: 0, side: "east" },
      pair: { key: "b>outside:east:4:0", from: "b", to: "outside" },
      isThere: true,
    });
  });
});
