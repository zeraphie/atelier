import { describe, expect, test } from "bun:test";
import { isDoubleTap, isTap, tapToHold } from "../../../src/camera/math/tap-math.js";

describe("isTap", () => {
  test("a press that stayed within a few pixels is a tap; one that travelled is a drag", () => {
    expect(isTap({ x: 10, y: 10 }, { x: 12, y: 11 })).toBe(true);
    expect(isTap({ x: 10, y: 10 }, { x: 14, y: 10 })).toBe(false);
  });
});

describe("isDoubleTap", () => {
  const first = { at: { x: 100, y: 100 }, time: 1000 };

  test("a second tap soon after and close to the first doubles it", () => {
    expect(isDoubleTap({ at: { x: 110, y: 95 }, time: 1200 }, first)).toBe(true);
  });

  test("too late, too far, or with no tap before, it is a single", () => {
    expect(isDoubleTap({ at: { x: 100, y: 100 }, time: 1300 }, first)).toBe(false);
    expect(isDoubleTap({ at: { x: 130, y: 100 }, time: 1100 }, first)).toBe(false);
    expect(isDoubleTap({ at: { x: 100, y: 100 }, time: 1100 }, undefined)).toBe(false);
  });
});

describe("tapToHold", () => {
  test("a single tap is held for the next; a double tap holds nothing, so a third tap is a single", () => {
    const tap = { at: { x: 1, y: 1 }, time: 5 };
    expect(tapToHold(tap, false)).toBe(tap);
    expect(tapToHold(tap, true)).toBeUndefined();
  });
});
