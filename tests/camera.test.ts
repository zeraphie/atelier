import { describe, expect, test } from "bun:test";
import { Camera, type CameraState } from "../src/camera/index.js";

describe("Camera", () => {
  test("starts at the origin at life size", () => {
    expect(new Camera().current).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  test("tells each listener about a change once, and not after it unsubscribes", () => {
    const camera = new Camera();
    const heard: CameraState[] = [];
    const stop = camera.onChange((state) => heard.push(state));
    camera.panBy(10, -5);
    stop();
    camera.panBy(1, 1);
    expect(heard).toEqual([{ x: 10, y: -5, zoom: 1 }]);
  });

  test("zooming about a screen point keeps the world point under it fixed", () => {
    const camera = new Camera({ min: 0.5, max: 4 });
    camera.panBy(120, 80);
    const anchor = { x: 300, y: 200 };
    const under = camera.toWorld(anchor);
    camera.zoomAt(anchor, 2);
    expect(camera.current.zoom).toBe(2);
    expect(camera.toScreen(under).x).toBeCloseTo(anchor.x, 10);
    expect(camera.toScreen(under).y).toBeCloseTo(anchor.y, 10);
  });

  test("zooming past a limit stops at it", () => {
    const camera = new Camera({ min: 0.5, max: 4 });
    camera.zoomAt({ x: 0, y: 0 }, 100);
    expect(camera.current.zoom).toBe(4);
  });

  test("fitting a rect shows all of it, centred", () => {
    const camera = new Camera();
    camera.fit({ width: 1000, height: 500 }, { left: 0, top: 0, right: 2000, bottom: 500 });
    expect(camera.toScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 125 });
    expect(camera.toScreen({ x: 2000, y: 500 })).toEqual({ x: 1000, y: 375 });
  });
});
