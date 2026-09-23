import { beforeEach, describe, expect, test } from "bun:test";
import type { Point } from "../src/geometry.js";
import {
  clearCursors,
  cursors,
  CursorSayer,
  dropCursor,
  placeCursor,
} from "../src/viewing/cursors.js";

// Stands in for requestAnimationFrame: what is asked waits for the next refresh.
class FakeRefresh {
  private queue: (() => void)[] = [];

  readonly request = (tell: () => void): void => {
    this.queue.push(tell);
  };

  refresh(): void {
    const due = this.queue;
    this.queue = [];
    for (const tell of due) {
      tell();
    }
  }
}

function setUp() {
  const refresh = new FakeRefresh();
  const said: (Point | null)[] = [];
  const sayer = new CursorSayer(refresh.request, (at) => {
    said.push(at);
  });
  return { refresh, sayer, said };
}

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
});

describe("CursorSayer", () => {
  test("many moves before a refresh are one saying, of the latest, in whole centimetres", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say({ x: 1.2, y: 2.7 });
    sayer.say({ x: 10.4, y: 20.6 });
    expect(said).toEqual([]);
    refresh.refresh();
    expect(said).toEqual([{ x: 10, y: 21 }]);
  });

  test("the same point again is not said again", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say({ x: 10, y: 20 });
    refresh.refresh();
    sayer.say({ x: 10.3, y: 19.8 });
    refresh.refresh();
    expect(said).toEqual([{ x: 10, y: 20 }]);
  });

  test("leaving the canvas is said once, and never before anything was", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say(undefined);
    refresh.refresh();
    expect(said).toEqual([]);
    sayer.say({ x: 5, y: 5 });
    refresh.refresh();
    sayer.say(undefined);
    refresh.refresh();
    sayer.say(undefined);
    refresh.refresh();
    expect(said).toEqual([{ x: 5, y: 5 }, null]);
  });

  test("saying again repeats the latest, for a peer who just arrived", () => {
    const { refresh, sayer, said } = setUp();
    sayer.say({ x: 5, y: 5 });
    refresh.refresh();
    sayer.sayAgain();
    refresh.refresh();
    expect(said).toEqual([
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ]);
  });
});
