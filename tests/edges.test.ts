import { describe, expect, test } from "bun:test";
import { edgeKey, edgeNear, edgeOnWall, edgeSegment, pairKey } from "../src/gallery/edges.js";

describe("edges", () => {
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

  test("lies on a wall only along it and within its ends", () => {
    const wall = { a: { x: 200, y: 0 }, b: { x: 200, y: 500 } };
    expect(edgeOnWall(wall, { col: 1, row: 2, side: "east" }, 100)).toBe(true);
    expect(edgeOnWall(wall, { col: 1, row: 5, side: "east" }, 100)).toBe(false);
    expect(edgeOnWall(wall, { col: 2, row: 2, side: "east" }, 100)).toBe(false);
    expect(edgeOnWall(wall, { col: 1, row: 2, side: "south" }, 100)).toBe(false);
  });

  test("the edge near a point is the nearest grid line's, within reach", () => {
    expect(edgeNear({ x: 203, y: 250 }, 100, 10)).toEqual({ col: 1, row: 2, side: "east" });
    expect(edgeNear({ x: 250, y: 297 }, 100, 10)).toEqual({ col: 2, row: 2, side: "south" });
    expect(edgeNear({ x: 250, y: 250 }, 100, 10)).toBeUndefined();
  });

  test("keys name an edge and a pair of rooms", () => {
    expect(edgeKey({ col: 1, row: 2, side: "east" })).toBe("east:1:2");
    expect(pairKey("foyer", "drawings")).toBe("foyer>drawings");
  });
});
