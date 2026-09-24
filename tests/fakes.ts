/**
 * ─ Fakes ─
 *
 * What stands in for the browser in a logic test: frames handed out
 * on demand in place of requestAnimationFrame, and a closeness check
 * for points that arithmetic has left a hair off. A fake handed in as
 * a function is not a mock; the code under test never knows.
 */

import { expect } from "bun:test";
import type { Point } from "../src/geometry.js";

/** Frames on demand: a callback waits for the next refresh, and one asked for during a refresh waits for the one after, as in a browser. */
export class FakeFrames {
  private queue: ((time: number) => void)[] = [];

  /** Hand this in wherever requestAnimationFrame is expected. */
  readonly request = (callback: (time: number) => void): void => {
    this.queue.push(callback);
  };

  /** The next refresh, at `time`: every callback waiting runs once. */
  refresh(time = 0): void {
    const due = this.queue;
    this.queue = [];
    for (const callback of due) {
      callback(time);
    }
  }

  /** How many callbacks wait for the next refresh. */
  get pending(): number {
    return this.queue.length;
  }
}

/** Two points the same to ten places. */
export function expectClose(actual: Point, expected: Point): void {
  expect(actual.x).toBeCloseTo(expected.x, 10);
  expect(actual.y).toBeCloseTo(expected.y, 10);
}
