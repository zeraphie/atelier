import { describe, expect, test } from "bun:test";
import {
  along,
  centre,
  contains,
  distance,
  roundedPoint,
  samePoint,
  toTenth,
  union,
} from "../src/geometry.js";

describe("geometry", () => {
  test("a point is rounded to the whole unit, and two are the same at that", () => {
    expect(roundedPoint({ x: 10.4, y: 20.6 })).toEqual({ x: 10, y: 21 });
    expect(samePoint(roundedPoint({ x: 10.4, y: 20.6 }), { x: 10, y: 21 })).toBe(true);
    expect(samePoint({ x: 10, y: 21 }, { x: 10, y: 22 })).toBe(false);
  });

  test("a length is kept to a tenth", () => {
    expect(toTenth(12.34)).toBe(12.3);
    expect(toTenth(12.35)).toBe(12.4);
    expect(toTenth(100)).toBe(100);
  });
});

describe("segments and rects", () => {
  test("a point along a segment, its middle, and a rect's middle", () => {
    const segment = { a: { x: 0, y: 0 }, b: { x: 300, y: 400 } };
    expect(distance(segment.a, segment.b)).toBe(500);
    expect(along(segment, 250)).toEqual({ x: 150, y: 200 });
    expect(along({ a: { x: 5, y: 5 }, b: { x: 5, y: 5 } }, 10)).toEqual({ x: 5, y: 5 });
    expect(centre(segment)).toEqual({ x: 150, y: 200 });
    expect(centre({ left: 0, top: 0, right: 100, bottom: 50 })).toEqual({ x: 50, y: 25 });
  });

  test("a rect holds its edges, and a union is the smallest rect round several", () => {
    const rect = { left: 0, top: 0, right: 100, bottom: 50 };
    expect(contains(rect, { x: 100, y: 50 })).toBe(true);
    expect(contains(rect, { x: 101, y: 50 })).toBe(false);
    expect(union([rect, { left: -10, top: 20, right: 30, bottom: 80 }])).toEqual({
      left: -10,
      top: 0,
      right: 100,
      bottom: 80,
    });
  });
});
