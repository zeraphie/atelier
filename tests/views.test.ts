import { beforeEach, describe, expect, test } from "bun:test";
import { clearViews, dropView, placeView, sameView, viewOf, views } from "../src/viewing/views.js";

describe("viewOf", () => {
  test("a view is the world point at the middle of the window, and the zoom", () => {
    expect(viewOf({ x: 0, y: 0, zoom: 2 }, { width: 800, height: 600 })).toEqual({
      centre: { x: 200, y: 150 },
      zoom: 2,
    });
    expect(viewOf({ x: -100, y: 50, zoom: 1 }, { width: 800, height: 600 })).toEqual({
      centre: { x: 500, y: 250 },
      zoom: 1,
    });
  });

  test("the point is to the centimetre and the zoom to a thousandth, so a camera at rest says nothing new", () => {
    const camera = { x: 0.3, y: 0.3, zoom: 1.23456 };
    const size = { width: 801, height: 601 };
    const view = viewOf(camera, size);
    expect(view.zoom).toBe(1.235);
    expect(Number.isInteger(view.centre.x) && Number.isInteger(view.centre.y)).toBe(true);
    expect(sameView(view, viewOf(camera, size))).toBe(true);
    expect(sameView(view, { ...view, zoom: 1.236 })).toBe(false);
  });
});

describe("the peers' views", () => {
  beforeEach(() => {
    clearViews();
  });

  test("a peer's view is kept by its id, null takes it away, and clearing takes them all", () => {
    const view = { centre: { x: 1, y: 2 }, zoom: 1 };
    placeView("a", view);
    placeView("b", view);
    expect(Object.keys(views.current)).toEqual(["a", "b"]);
    placeView("a", null);
    expect(Object.keys(views.current)).toEqual(["b"]);
    const before = views.current;
    dropView("a");
    expect(views.current).toBe(before);
    clearViews();
    expect(views.current).toEqual({});
  });
});
