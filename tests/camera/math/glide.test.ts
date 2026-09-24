import { describe, expect, test } from "bun:test";
import { between, centredOn, eased, glide } from "../../../src/camera/math/glide.js";
import { Camera, screenToWorld, type CameraState } from "../../../src/camera/index.js";
import { FakeFrames } from "../../fakes.js";

const size = { width: 1000, height: 500 };
const from: CameraState = { x: 0, y: 0, zoom: 1 };
const to: CameraState = { x: -1500, y: -700, zoom: 4 };

// Frames handed out on demand, each with the time asked for.

describe("eased", () => {
  test("starts at nothing, ends at everything, halfway at halfway", () => {
    expect(eased(0)).toBe(0);
    expect(eased(1)).toBe(1);
    expect(eased(0.5)).toBe(0.5);
  });
});

describe("centredOn", () => {
  test("puts the point at the centre of the view", () => {
    const state = centredOn({ x: 200, y: 100 }, 2, size);
    expect(screenToWorld(state, { x: 500, y: 250 })).toEqual({ x: 200, y: 100 });
  });
});

describe("between", () => {
  test("is the start at 0 and the end at 1", () => {
    expect(between(from, to, size, 0)).toEqual(from);
    const end = between(from, to, size, 1);
    expect(end.zoom).toBeCloseTo(to.zoom, 10);
    expect(end.x).toBeCloseTo(to.x, 10);
    expect(end.y).toBeCloseTo(to.y, 10);
  });

  test("halfway, the zoom is the geometric mean and the centre is the midpoint", () => {
    const middle = { x: 500, y: 250 };
    const half = between(from, to, size, 0.5);
    expect(half.zoom).toBeCloseTo(2, 10);
    const a = screenToWorld(from, middle);
    const b = screenToWorld(to, middle);
    const c = screenToWorld(half, middle);
    expect(c.x).toBeCloseTo((a.x + b.x) / 2, 10);
    expect(c.y).toBeCloseTo((a.y + b.y) / 2, 10);
  });
});

describe("glide", () => {
  test("arrives over the frames, then asks for no more", () => {
    const frames = new FakeFrames();
    const camera = new Camera({ min: 0.1, max: 8 });
    glide(camera, to, size, 100, frames.request);
    frames.refresh(1000);
    frames.refresh(1050);
    expect(camera.current.zoom).toBeCloseTo(2, 10);
    frames.refresh(1100);
    expect(camera.current.zoom).toBeCloseTo(4, 10);
    expect(frames.pending).toBe(0);
  });

  test("stops when something else moves the camera", () => {
    const frames = new FakeFrames();
    const camera = new Camera({ min: 0.1, max: 8 });
    glide(camera, to, size, 100, frames.request);
    frames.refresh(1000);
    frames.refresh(1025);
    camera.panBy(10, 0);
    const moved = camera.current;
    frames.refresh(1050);
    expect(camera.current).toBe(moved);
    expect(frames.pending).toBe(0);
  });

  test("with no time, sets the camera at once", () => {
    const frames = new FakeFrames();
    const camera = new Camera({ min: 0.1, max: 8 });
    glide(camera, to, size, 0, frames.request);
    expect(camera.current).toEqual(to);
    expect(frames.pending).toBe(0);
  });
});
