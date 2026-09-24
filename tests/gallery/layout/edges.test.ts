import { describe, expect, test } from "bun:test";
import {
  edgeKey,
  edgeNear,
  edgesNear,
  edgeOnRect,
  edgeOnWall,
  edgeSegment,
  pairKey,
} from "../../../src/gallery/layout/edges.js";

describe("edgeSegment", () => {
  test("an east edge runs down a cell's right side, a south edge along its bottom", () => {
    expect(edgeSegment({ col: 1, row: 2, side: "east" }, 100)).toEqual({
      a: { x: 200, y: 200 },
      b: { x: 200, y: 300 },
    });
    expect(edgeSegment({ col: 1, row: 2, side: "south" }, 100)).toEqual({
      a: { x: 100, y: 300 },
      b: { x: 200, y: 300 },
    });
  });
});

describe("edgeOnWall", () => {
  test("an edge lies on a wall only along it and within its ends", () => {
    const wall = { a: { x: 200, y: 0 }, b: { x: 200, y: 500 } };
    expect(edgeOnWall(wall, { col: 1, row: 2, side: "east" }, 100)).toBe(true);
    expect(edgeOnWall(wall, { col: 1, row: 5, side: "east" }, 100)).toBe(false);
    expect(edgeOnWall(wall, { col: 2, row: 2, side: "east" }, 100)).toBe(false);
    expect(edgeOnWall(wall, { col: 1, row: 2, side: "south" }, 100)).toBe(false);
  });
});

describe("edgeNear", () => {
  test("the edge near a point is the nearest grid line's, within reach", () => {
    expect(edgeNear({ x: 203, y: 250 }, 100, 10)).toEqual({ col: 1, row: 2, side: "east" });
    expect(edgeNear({ x: 250, y: 297 }, 100, 10)).toEqual({ col: 2, row: 2, side: "south" });
    expect(edgeNear({ x: 250, y: 250 }, 100, 10)).toBeUndefined();
  });
});

describe("edgeKey and pairKey", () => {
  test("an edge is keyed by its side and cell, a pair by its rooms in tour order", () => {
    expect(edgeKey({ col: 1, row: 2, side: "east" })).toBe("east:1:2");
    expect(pairKey("foyer", "drawings")).toBe("foyer>drawings");
  });
});

describe("edgeOnRect", () => {
  const rect = { left: 100, top: 100, right: 300, bottom: 300 };

  test("an edge along one of the rect's sides, within its ends", () => {
    expect(edgeOnRect(rect, { col: 0, row: 1, side: "east" }, 100)).toBe(true);
    expect(edgeOnRect(rect, { col: 2, row: 2, side: "east" }, 100)).toBe(true);
    expect(edgeOnRect(rect, { col: 1, row: 0, side: "south" }, 100)).toBe(true);
    expect(edgeOnRect(rect, { col: 2, row: 2, side: "south" }, 100)).toBe(true);
  });

  test("not an edge inside, beyond an end, or on another line", () => {
    expect(edgeOnRect(rect, { col: 1, row: 1, side: "east" }, 100)).toBe(false);
    expect(edgeOnRect(rect, { col: 0, row: 3, side: "east" }, 100)).toBe(false);
    expect(edgeOnRect(rect, { col: 1, row: 1, side: "south" }, 100)).toBe(false);
  });
});

describe("edgesNear", () => {
  test("at a crossing, both lines' edges, the nearer first; near one line, that one alone", () => {
    expect(edgesNear({ x: 203, y: 298 }, 100, 10)).toEqual([
      { col: 2, row: 2, side: "south" },
      { col: 1, row: 2, side: "east" },
    ]);
    expect(edgesNear({ x: 200, y: 300 }, 100, 10)).toHaveLength(2);
    expect(edgesNear({ x: 250, y: 297 }, 100, 10)).toEqual([{ col: 2, row: 2, side: "south" }]);
    expect(edgesNear({ x: 250, y: 250 }, 100, 10)).toEqual([]);
  });
});

describe("edgesNear, with a wide reach", () => {
  test("every line within reach, nearest first, so a wall beyond a nearer line is still found", () => {
    expect(edgesNear({ x: 240, y: 250 }, 100, 60)).toEqual([
      { col: 1, row: 2, side: "east" },
      { col: 2, row: 1, side: "south" },
      { col: 2, row: 2, side: "south" },
      { col: 2, row: 2, side: "east" },
    ]);
  });
});
