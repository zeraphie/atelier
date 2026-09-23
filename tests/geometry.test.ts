import { describe, expect, test } from "bun:test";
import { roundedPoint, samePoint, toTenth } from "../src/geometry.js";

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
