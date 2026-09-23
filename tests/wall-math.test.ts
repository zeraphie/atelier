import { describe, expect, test } from "bun:test";
import { cut, longestFree, shrink, sideOf, widen } from "../src/gallery/wall-math.js";

const wall = { a: { x: 0, y: 0 }, b: { x: 400, y: 0 } };

describe("cut", () => {
  test("a gap along the wall leaves the pieces either side of it", () => {
    expect(cut(wall, { a: { x: 100, y: 0 }, b: { x: 150, y: 0 } })).toEqual([
      { a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
      { a: { x: 150, y: 0 }, b: { x: 400, y: 0 } },
    ]);
  });

  test("a gap at an end leaves one piece, and a gap on another line leaves the wall whole", () => {
    expect(cut(wall, { a: { x: 0, y: 0 }, b: { x: 50, y: 0 } })).toEqual([
      { a: { x: 50, y: 0 }, b: { x: 400, y: 0 } },
    ]);
    expect(cut(wall, { a: { x: 100, y: 5 }, b: { x: 150, y: 5 } })).toEqual([wall]);
  });
});

describe("longestFree", () => {
  test("the longest piece between the gaps; a wall that is all gap has its midpoint", () => {
    const gaps = [
      { a: { x: 50, y: 0 }, b: { x: 100, y: 0 } },
      { a: { x: 300, y: 0 }, b: { x: 350, y: 0 } },
    ];
    expect(longestFree(wall, gaps)).toEqual({ a: { x: 100, y: 0 }, b: { x: 300, y: 0 } });
    expect(longestFree(wall, [wall])).toEqual({ a: { x: 200, y: 0 }, b: { x: 200, y: 0 } });
  });
});

describe("shrink and widen", () => {
  test("a stretch loses a margin at each end, or collapses to its middle when too short", () => {
    expect(shrink(wall, 25)).toEqual({ a: { x: 25, y: 0 }, b: { x: 375, y: 0 } });
    expect(shrink({ a: { x: 0, y: 0 }, b: { x: 40, y: 0 } }, 25)).toEqual({
      a: { x: 20, y: 0 },
      b: { x: 20, y: 0 },
    });
  });

  test("a gap grows by half the wall at each end, whichever way it runs", () => {
    expect(widen({ a: { x: 100, y: 0 }, b: { x: 150, y: 0 } }, 8)).toEqual({
      a: { x: 96, y: 0 },
      b: { x: 154, y: 0 },
    });
    expect(widen({ a: { x: 0, y: 150 }, b: { x: 0, y: 100 } }, 8)).toEqual({
      a: { x: 0, y: 154 },
      b: { x: 0, y: 96 },
    });
  });
});

describe("sideOf", () => {
  test("names the wall a gap lies on, and refuses a gap on none", () => {
    const rect = { left: 0, top: 0, right: 400, bottom: 300 };
    expect(sideOf(rect, { a: { x: 400, y: 100 }, b: { x: 400, y: 150 } })).toBe("right");
    expect(() => sideOf(rect, { a: { x: 50, y: 50 }, b: { x: 100, y: 50 } })).toThrow();
  });
});
