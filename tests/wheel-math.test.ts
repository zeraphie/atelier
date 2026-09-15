import { describe, expect, test } from "bun:test";
import { wheelDeltaToPixels, wheelIntent, wheelZoomFactor } from "../src/camera/index.js";
import type { WheelInput } from "../src/camera/wheel-math.js";

const view = { width: 1200, height: 900 };

function wheel(input: Partial<WheelInput>): WheelInput {
  return {
    deltaX: 0,
    deltaY: 0,
    deltaMode: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...input,
  };
}

describe("wheelDeltaToPixels", () => {
  test("passes pixel deltas through unchanged", () => {
    expect(wheelDeltaToPixels(37, 0, 900)).toBe(37);
  });

  test("scales line deltas by a text row", () => {
    expect(wheelDeltaToPixels(3, 1, 900)).toBe(48);
  });

  test("scales page deltas by the viewport extent", () => {
    expect(wheelDeltaToPixels(-1, 2, 900)).toBe(-900);
  });
});

describe("wheelZoomFactor", () => {
  test("a hundred pixels of pinch, in small events, doubles the zoom", () => {
    let zoom = 1;
    for (let i = 0; i < 20; i += 1) {
      zoom *= wheelZoomFactor(-5);
    }
    expect(zoom).toBeCloseTo(2, 10);
  });

  test("one event is capped, so a mouse notch with Ctrl is a step, not a doubling", () => {
    expect(wheelZoomFactor(-100)).toBeCloseTo(2 ** 0.2, 10);
    expect(wheelZoomFactor(100)).toBeCloseTo(2 ** -0.2, 10);
  });

  test("no delta means no change, and opposite deltas cancel exactly", () => {
    expect(wheelZoomFactor(0)).toBe(1);
    expect(wheelZoomFactor(7) * wheelZoomFactor(-7)).toBeCloseTo(1, 10);
  });
});

describe("wheelIntent", () => {
  test("a plain wheel pans the other way, on both axes", () => {
    expect(wheelIntent(wheel({ deltaX: 12, deltaY: -30 }), view)).toEqual({
      kind: "pan",
      dx: -12,
      dy: 30,
    });
  });

  test("Ctrl, which is how a pinch arrives, or Command, zooms", () => {
    expect(wheelIntent(wheel({ deltaY: -10, ctrlKey: true }), view)).toEqual({
      kind: "zoom",
      factor: wheelZoomFactor(-10),
    });
    expect(wheelIntent(wheel({ deltaY: 3, deltaMode: 1, metaKey: true }), view)).toEqual({
      kind: "zoom",
      factor: wheelZoomFactor(48),
    });
  });

  test("Shift turns a wheel with one axis sideways, and leaves one with two alone", () => {
    expect(wheelIntent(wheel({ deltaY: 40, shiftKey: true }), view)).toEqual({
      kind: "pan",
      dx: -40,
      dy: 0,
    });
    expect(wheelIntent(wheel({ deltaX: 40, shiftKey: true }), view)).toEqual({
      kind: "pan",
      dx: -40,
      dy: -0,
    });
  });

  test("lines and pages are pixels first", () => {
    expect(wheelIntent(wheel({ deltaY: 1, deltaMode: 2 }), view)).toEqual({
      kind: "pan",
      dx: -0,
      dy: -900,
    });
  });
});
