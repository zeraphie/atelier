import { describe, expect, test } from "bun:test";
import { keptAfter, latest, latestFirst, latestIn, stamp } from "../src/state/utils/stamped.js";

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

describe("latestIn", () => {
  test("sets a key at a time, unless what the map holds there is later", () => {
    const map = { a: { value: 1, at: 20 } };
    expect(latestIn(map, "a", 2, 30)).toEqual({ a: { value: 2, at: 30 } });
    expect(latestIn(map, "a", 2, 10)).toEqual(map);
    expect(latestIn(map, "b", 3, 10)).toEqual({ a: { value: 1, at: 20 }, b: { value: 3, at: 10 } });
  });
});

describe("keptAfter, over a record of optional stamps", () => {
  test("an entry never set is not kept either, so a room's edits can be cut the same way", () => {
    const kept = keptAfter(
      { old: { value: 1, at: 5 }, unset: undefined, late: { value: 2, at: 15 } },
      10
    );
    expect(Object.keys(kept)).toEqual(["late"]);
  });
});

describe("latestFirst", () => {
  test("the keys of a stamped map, latest first", () => {
    expect(latestFirst({ a: { at: 5 }, b: { at: 15 }, c: { at: 10 } })).toEqual(["b", "c", "a"]);
    expect(latestFirst({})).toEqual([]);
  });
});
