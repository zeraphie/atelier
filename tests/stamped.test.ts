import { describe, expect, test } from "bun:test";
import { keptAfter, latest, stamp } from "../src/state/utils/stamped.js";

describe("latest", () => {
  test("takes the later value, whichever order they come in", () => {
    const early = { value: "a", at: 10 };
    const late = { value: "b", at: 20 };
    expect(latest(early, late)).toBe(late);
    expect(latest(late, early)).toBe(late);
  });

  test("takes what is given when nothing is held, and keeps what is held on a tie", () => {
    const held = { value: "a", at: 10 };
    expect(latest(undefined, held)).toBe(held);
    expect(latest(held, { value: "b", at: 10 })).toBe(held);
  });
});

describe("keptAfter", () => {
  test("keeps only what was set after the moment", () => {
    const kept = keptAfter({ old: { value: 1, at: 5 }, new: { value: 2, at: 15 } }, 10);
    expect(Object.keys(kept)).toEqual(["new"]);
  });
});

describe("stamp", () => {
  test("keeps a time it is given, and makes one otherwise", () => {
    expect(stamp({ at: 7, remote: true })).toEqual({ at: 7, remote: true });
    expect(stamp().at).toBeGreaterThan(0);
  });
});
