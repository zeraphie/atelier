import { describe, expect, test } from "bun:test";
import {
  clampZoom,
  pan,
  screenToWorld,
  visibleRect,
  worldToScreen,
  zoomAbout,
  type CameraState,
  type ZoomLimits,
} from "../../../src/camera/index.js";
import type { Point } from "../../../src/geometry.js";
import { expectClose } from "../../fakes.js";

const limits: ZoomLimits = { min: 0.25, max: 4 };
const camera: CameraState = { x: 100, y: 50, zoom: 2 };

describe("worldToScreen and screenToWorld", () => {
  test("a world point lands on screen scaled by the zoom and shifted by the offset", () => {
    expect(worldToScreen(camera, { x: 10, y: -5 })).toEqual({ x: 120, y: 40 });
  });

  test("a screen point goes back to the world point it came from", () => {
    const world = { x: -37.5, y: 812.25 };
    expectClose(screenToWorld(camera, worldToScreen(camera, world)), world);
  });
});

describe("pan", () => {
  test("moves the origin by the screen delta and keeps zoom", () => {
    expect(pan(camera, -30, 12)).toEqual({ x: 70, y: 62, zoom: 2 });
  });
});

describe("clampZoom", () => {
  test("passes values inside the limits through", () => {
    expect(clampZoom(1.5, limits)).toBe(1.5);
  });

  test("clamps below the minimum and above the maximum", () => {
    expect(clampZoom(0.01, limits)).toBe(0.25);
    expect(clampZoom(40, limits)).toBe(4);
  });
});

describe("zoomAbout", () => {
  const anchor: Point = { x: 400, y: 300 };

  test("keeps the world point under the anchor fixed", () => {
    const under = screenToWorld(camera, anchor);
    const next = zoomAbout(camera, anchor, 1.5, limits);
    expect(next.zoom).toBe(3);
    expectClose(worldToScreen(next, under), anchor);
  });

  test("keeps the anchor fixed when zooming out", () => {
    const under = screenToWorld(camera, anchor);
    const next = zoomAbout(camera, anchor, 0.5, limits);
    expect(next.zoom).toBe(1);
    expectClose(worldToScreen(next, under), anchor);
  });

  test("clamps to the limits and still keeps the anchor fixed", () => {
    const under = screenToWorld(camera, anchor);
    const next = zoomAbout(camera, anchor, 100, limits);
    expect(next.zoom).toBe(limits.max);
    expectClose(worldToScreen(next, under), anchor);
  });

  test("a factor of one changes nothing", () => {
    expect(zoomAbout(camera, anchor, 1, limits)).toEqual(camera);
  });
});

describe("visibleRect", () => {
  test("is the view's corners in the world, at the zoom", () => {
    const camera: CameraState = { x: -100, y: -50, zoom: 2 };
    expect(visibleRect(camera, { width: 800, height: 600 })).toEqual({
      left: 50,
      top: 25,
      right: 450,
      bottom: 325,
    });
  });
});
