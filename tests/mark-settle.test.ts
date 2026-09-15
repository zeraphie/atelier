import { describe, expect, test } from "bun:test";
import { wayToDrawn } from "../src/ui/mark-settle.js";

const DRAW = 800;

describe("wayToDrawn", () => {
  test("in the delay, the whole first draw is still to come", () => {
    expect(wayToDrawn({ currentTime: 50, delay: 180 }, DRAW)).toEqual({
      reverse: false,
      remainingMs: 130 + DRAW,
    });
  });

  test("mid-draw, the rest of the draw remains", () => {
    expect(wayToDrawn({ currentTime: 300, delay: 0 }, DRAW)).toEqual({
      reverse: false,
      remainingMs: 500,
    });
  });

  test("mid-undraw, the letter turns round and the way back is what it undrew", () => {
    expect(wayToDrawn({ currentTime: 1100, delay: 0 }, DRAW)).toEqual({
      reverse: true,
      remainingMs: 300,
    });
  });

  test("the delay shifts every iteration", () => {
    expect(wayToDrawn({ currentTime: 1280, delay: 180 }, DRAW)).toEqual({
      reverse: true,
      remainingMs: 300,
    });
  });

  test("later iterations alternate the same way", () => {
    expect(wayToDrawn({ currentTime: 2000, delay: 0 }, DRAW).reverse).toBe(false);
    expect(wayToDrawn({ currentTime: 2900, delay: 0 }, DRAW)).toEqual({
      reverse: true,
      remainingMs: 500,
    });
  });

  test("on the boundary after a draw, turning round costs nothing", () => {
    expect(wayToDrawn({ currentTime: 800, delay: 0 }, DRAW)).toEqual({
      reverse: true,
      remainingMs: 0,
    });
  });
});
