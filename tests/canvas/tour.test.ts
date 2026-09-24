import { describe, expect, test } from "bun:test";
import { Camera } from "../../src/camera/index.js";
import { Tour } from "../../src/canvas/tour.js";
import type { HungRoom, HungWork } from "../../src/gallery/layout/hang.js";
import type { Route } from "../../src/gallery/route/route.js";
import { room, work } from "../fixtures.js";

// Three stops in one room, each a metre square, a metre apart.
function routeOfThree(): Route {
  const hung: HungRoom = {
    room: room("a", 0, 0, 4, 1),
    rect: { left: 0, top: 0, right: 400, bottom: 100 },
    works: [],
  };
  const stops = ["w1", "w2", "w3"].map((id, i): { work: HungWork; room: HungRoom } => ({
    work: {
      work: work(id, 50, 50),
      rect: { left: i * 100, top: 0, right: i * 100 + 50, bottom: 50 },
    },
    room: hung,
  }));
  return { stops };
}

function setUp() {
  const camera = new Camera();
  const ticks: (() => void)[] = [];
  let stopped = 0;
  const tour = new Tour({
    camera,
    route: routeOfThree,
    canvasSize: () => ({ width: 800, height: 600 }),
    extentOf: (stop) => stop.work.rect,
    fitPadding: 0,
    isMotionReduced: () => true,
    frame: () => {},
    every: (tick) => {
      ticks.push(tick);
      return () => {
        stopped += 1;
      };
    },
  });
  return { camera, tour, tick: () => ticks.at(-1)?.(), stopped: () => stopped };
}

describe("Tour", () => {
  test("off the tour it stands at no stop and counts the route's works", () => {
    const { tour } = setUp();
    expect(tour.stop.current).toBe(-1);
    expect(tour.count).toBe(3);
  });

  test("start goes to the first work and fits it, and next and previous step either side", () => {
    const { camera, tour } = setUp();
    tour.start();
    expect(tour.stop.current).toBe(0);
    expect(camera.current).toEqual(
      camera.fitted({ width: 800, height: 600 }, { left: 0, top: 0, right: 50, bottom: 50 })
    );
    tour.next();
    expect(tour.stop.current).toBe(1);
    tour.previous();
    expect(tour.stop.current).toBe(0);
  });

  test("a step past either end goes nowhere", () => {
    const { tour } = setUp();
    tour.previous();
    expect(tour.stop.current).toBe(-1);
    tour.start();
    tour.next();
    tour.next();
    tour.next();
    expect(tour.stop.current).toBe(2);
  });

  test("entering at a work joins the tour there; an unknown work changes nothing", () => {
    const { tour } = setUp();
    tour.enterAt("w2");
    expect(tour.stop.current).toBe(1);
    tour.enterAt("nope");
    expect(tour.stop.current).toBe(1);
  });

  test("play starts from the first when off the tour, steps on each tick, and pauses at the last", () => {
    const { tour, tick, stopped } = setUp();
    tour.play();
    expect(tour.playing.current).toBe(true);
    expect(tour.stop.current).toBe(0);
    tick();
    expect(tour.stop.current).toBe(1);
    tick();
    expect(tour.stop.current).toBe(2);
    tick();
    expect(tour.playing.current).toBe(false);
    expect(stopped()).toBe(1);
  });

  test("playing again while playing is nothing, and pause stops the ticking", () => {
    const { tour, stopped } = setUp();
    tour.play();
    tour.play();
    tour.pause();
    expect(tour.playing.current).toBe(false);
    expect(stopped()).toBe(1);
  });

  test("leaving stops play and stands at no stop", () => {
    const { tour, stopped } = setUp();
    tour.play();
    tour.leave();
    expect(tour.stop.current).toBe(-1);
    expect(tour.playing.current).toBe(false);
    expect(stopped()).toBe(1);
  });
});
