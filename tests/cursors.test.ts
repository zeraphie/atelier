import { beforeEach, describe, expect, test } from "bun:test";
import {
  clearCursors,
  cursors,
  dropCursor,
  placeCursor,
  roundedPoint,
  samePoint,
} from "../src/viewing/cursors.js";

describe("the peers' cursors", () => {
  beforeEach(() => {
    clearCursors();
  });

  test("a peer's pointer is kept by its id, and null takes it away", () => {
    placeCursor("a", { x: 1, y: 2 });
    placeCursor("b", { x: 3, y: 4 });
    expect(cursors.current).toEqual({ a: { x: 1, y: 2 }, b: { x: 3, y: 4 } });
    placeCursor("a", null);
    expect(cursors.current).toEqual({ b: { x: 3, y: 4 } });
  });

  test("dropping a pointer that is not there changes nothing, so nothing re-renders", () => {
    placeCursor("a", { x: 1, y: 2 });
    const before = cursors.current;
    dropCursor("b");
    expect(cursors.current).toBe(before);
  });

  test("clearing takes every pointer away", () => {
    placeCursor("a", { x: 1, y: 2 });
    clearCursors();
    expect(cursors.current).toEqual({});
  });

  test("a point is said to the centimetre, and two are the same at that", () => {
    expect(roundedPoint({ x: 10.4, y: 20.6 })).toEqual({ x: 10, y: 21 });
    expect(samePoint(roundedPoint({ x: 10.4, y: 20.6 }), { x: 10, y: 21 })).toBe(true);
    expect(samePoint({ x: 10, y: 21 }, { x: 10, y: 22 })).toBe(false);
  });
});
