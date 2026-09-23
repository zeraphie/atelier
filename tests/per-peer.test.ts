import { describe, expect, test } from "bun:test";
import { perPeer } from "../src/viewing/per-peer.js";

describe("perPeer", () => {
  test("a peer's thing is kept by its id, and null takes it away", () => {
    const kept = perPeer<number>();
    kept.place("a", 1);
    kept.place("b", 2);
    expect(kept.store.current).toEqual({ a: 1, b: 2 });
    kept.place("a", null);
    expect(kept.store.current).toEqual({ b: 2 });
  });

  test("dropping what is not there changes nothing, so nothing re-renders", () => {
    const kept = perPeer<number>();
    kept.place("a", 1);
    const before = kept.store.current;
    kept.drop("b");
    expect(kept.store.current).toBe(before);
  });

  test("clearing takes everything away, and clearing nothing is nothing", () => {
    const kept = perPeer<number>();
    const empty = kept.store.current;
    kept.clear();
    expect(kept.store.current).toBe(empty);
    kept.place("a", 1);
    kept.clear();
    expect(kept.store.current).toEqual({});
  });
});
