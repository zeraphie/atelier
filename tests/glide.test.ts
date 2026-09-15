import { describe, expect, test } from "bun:test";
import {
  along,
  between,
  centredOn,
  eased,
  glide,
  glideAlong,
  pathLength,
} from "../src/camera/glide.js";
import { Camera, screenToWorld, type CameraState } from "../src/camera/index.js";

const view = { width: 1000, height: 500 };
const from: CameraState = { x: 0, y: 0, zoom: 1 };
const to: CameraState = { x: -1500, y: -700, zoom: 4 };

// Frames handed out on demand, each with the time asked for.
class FakeFrames {
  private queue: ((time: number) => void)[] = [];

  readonly request = (callback: (time: number) => void): void => {
    this.queue.push(callback);
  };

  run(time: number): void {
    const due = this.queue;
    this.queue = [];
    for (const callback of due) {
      callback(time);
    }
  }

  get pending(): number {
    return this.queue.length;
  }
}

describe("eased", () => {
  test("starts at nothing, ends at everything, halfway at halfway", () => {
    expect(eased(0)).toBe(0);
    expect(eased(1)).toBe(1);
    expect(eased(0.5)).toBe(0.5);
  });
});

describe("centredOn", () => {
  test("puts the point at the centre of the view", () => {
    const state = centredOn({ x: 200, y: 100 }, 2, view);
    expect(screenToWorld(state, { x: 500, y: 250 })).toEqual({ x: 200, y: 100 });
  });
});

describe("between", () => {
  test("is the start at 0 and the end at 1", () => {
    expect(between(from, to, view, 0)).toEqual(from);
    const end = between(from, to, view, 1);
    expect(end.zoom).toBeCloseTo(to.zoom, 10);
    expect(end.x).toBeCloseTo(to.x, 10);
    expect(end.y).toBeCloseTo(to.y, 10);
  });

  test("halfway, the zoom is the geometric mean and the centre is the midpoint", () => {
    const middle = { x: 500, y: 250 };
    const half = between(from, to, view, 0.5);
    expect(half.zoom).toBeCloseTo(2, 10);
    const a = screenToWorld(from, middle);
    const b = screenToWorld(to, middle);
    const c = screenToWorld(half, middle);
    expect(c.x).toBeCloseTo((a.x + b.x) / 2, 10);
    expect(c.y).toBeCloseTo((a.y + b.y) / 2, 10);
  });
});

describe("along", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ];

  test("measures the path", () => {
    expect(pathLength(path)).toBe(200);
  });

  test("is the first point at 0, the last at 1, and the corner halfway", () => {
    expect(along(path, 0)).toEqual({ x: 0, y: 0 });
    expect(along(path, 1)).toEqual({ x: 100, y: 100 });
    expect(along(path, 0.5)).toEqual({ x: 100, y: 0 });
    expect(along(path, 0.75)).toEqual({ x: 100, y: 50 });
  });

  test("an empty path is a fault", () => {
    expect(() => along([], 0.5)).toThrow();
  });
});

describe("glide", () => {
  test("arrives over the frames, says so, then asks for no more", () => {
    const frames = new FakeFrames();
    const camera = new Camera({ min: 0.1, max: 8 });
    let arrived: boolean | undefined;
    glide(camera, to, view, 100, frames.request, (ok) => {
      arrived = ok;
    });
    frames.run(1000);
    frames.run(1050);
    expect(camera.current.zoom).toBeCloseTo(2, 10);
    expect(arrived).toBeUndefined();
    frames.run(1100);
    expect(camera.current.zoom).toBeCloseTo(4, 10);
    expect(arrived).toBe(true);
    expect(frames.pending).toBe(0);
  });

  test("stops when something else moves the camera, and says it did not arrive", () => {
    const frames = new FakeFrames();
    const camera = new Camera({ min: 0.1, max: 8 });
    let arrived: boolean | undefined;
    glide(camera, to, view, 100, frames.request, (ok) => {
      arrived = ok;
    });
    frames.run(1000);
    frames.run(1025);
    camera.panBy(10, 0);
    const moved = camera.current;
    frames.run(1050);
    expect(camera.current).toBe(moved);
    expect(arrived).toBe(false);
    expect(frames.pending).toBe(0);
  });

  test("with no time, sets the camera at once", () => {
    const frames = new FakeFrames();
    const camera = new Camera({ min: 0.1, max: 8 });
    glide(camera, to, view, 0, frames.request);
    expect(camera.current).toEqual(to);
    expect(frames.pending).toBe(0);
  });
});

describe("glideAlong", () => {
  test("takes the centre of the view down the path and arrives at its end", () => {
    const frames = new FakeFrames();
    const camera = new Camera({ min: 0.1, max: 8 });
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    let arrived = false;
    glideAlong(camera, path, 2, view, 100, frames.request, (ok) => {
      arrived = ok;
    });
    frames.run(0);
    frames.run(50);
    expect(screenToWorld(camera.current, { x: 500, y: 250 })).toEqual({ x: 100, y: 0 });
    frames.run(100);
    expect(screenToWorld(camera.current, { x: 500, y: 250 })).toEqual({ x: 100, y: 100 });
    expect(camera.current.zoom).toBe(2);
    expect(arrived).toBe(true);
  });
});
