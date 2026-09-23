import { describe, expect, test } from "bun:test";
import { Hydration, type Timer } from "../src/storage/hydration.js";

// A clock that fires only when the test says.
function clock(): { timer: Timer; fire: () => void } {
  let due: (() => void) | undefined;
  return {
    timer: (callback) => {
      due = callback;
    },
    fire: () => due?.(),
  };
}

// Whether a promise has resolved by now: its callback runs a tick after it
// does, so two ticks are given, and nothing is waited on beyond them.
async function isDone(promise: Promise<void>): Promise<boolean> {
  let done = false;
  void promise.then(() => {
    done = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  return done;
}

describe("Hydration", () => {
  test("waits for every expected store, and no longer", async () => {
    const { timer } = clock();
    const hydration = new Hydration(1000, timer);
    hydration.expect("comments");
    hydration.expect("edits");
    const done = hydration.whenDone();
    expect(await isDone(done)).toBe(false);
    hydration.loaded("comments");
    expect(await isDone(done)).toBe(false);
    hydration.loaded("edits");
    expect(await isDone(done)).toBe(true);
    expect(hydration.waiting).toEqual([]);
  });

  test("with nothing expected, is done at once", async () => {
    const { timer } = clock();
    const hydration = new Hydration(1000, timer);
    expect(await isDone(hydration.whenDone())).toBe(true);
  });

  test("a store reporting twice, or one never expected, changes nothing", async () => {
    const { timer } = clock();
    const hydration = new Hydration(1000, timer);
    hydration.expect("comments");
    hydration.loaded("pictures");
    hydration.loaded("comments");
    hydration.loaded("comments");
    expect(await isDone(hydration.whenDone())).toBe(true);
  });

  test("gives up at the deadline, and says who never answered", async () => {
    const { timer, fire } = clock();
    const hydration = new Hydration(1000, timer);
    hydration.expect("comments");
    const done = hydration.whenDone();
    expect(await isDone(done)).toBe(false);
    fire();
    expect(await isDone(done)).toBe(true);
    expect(hydration.waiting).toEqual(["comments"]);
  });

  test("a store expected after the deadline is not waited for", async () => {
    const { timer, fire } = clock();
    const hydration = new Hydration(1000, timer);
    fire();
    hydration.expect("late");
    expect(hydration.waiting).toEqual([]);
    expect(await isDone(hydration.whenDone())).toBe(true);
  });
});
