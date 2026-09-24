import { describe, expect, test } from "bun:test";
import { lookOf, sameLook } from "../../../src/viewing/presence/looks.js";

describe("lookOf", () => {
  test("a look is the world point at the middle of the canvas, and the zoom", () => {
    expect(lookOf({ x: 0, y: 0, zoom: 2 }, { width: 800, height: 600 })).toEqual({
      centre: { x: 200, y: 150 },
      zoom: 2,
    });
    expect(lookOf({ x: -100, y: 50, zoom: 1 }, { width: 800, height: 600 })).toEqual({
      centre: { x: 500, y: 250 },
      zoom: 1,
    });
  });

  test("the point is to the centimetre and the zoom to a thousandth, so a camera at rest says nothing new", () => {
    const camera = { x: 0.3, y: 0.3, zoom: 1.23456 };
    const size = { width: 801, height: 601 };
    const look = lookOf(camera, size);
    expect(look.zoom).toBe(1.235);
    expect(Number.isInteger(look.centre.x) && Number.isInteger(look.centre.y)).toBe(true);
    expect(sameLook(look, lookOf(camera, size))).toBe(true);
    expect(sameLook(look, { ...look, zoom: 1.236 })).toBe(false);
  });
});
