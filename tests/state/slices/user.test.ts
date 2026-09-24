import { describe, expect, test } from "bun:test";
import { ownStore } from "../../fixtures.js";

describe("the user slice", () => {
  test("a browser has an id made once, and a visitor's name until one is set", () => {
    const { state } = ownStore();
    expect(state().userId).toMatch(/^[0-9a-f-]{36}$/);
    expect(state().name).toMatch(/^Visitor \d{3}$/);
    expect(state().color).toBeUndefined();
  });

  test("a name is kept trimmed, and a blank one falls back to a fresh visitor's name", () => {
    const { state } = ownStore();
    state().setName("  Ren ");
    expect(state().name).toBe("Ren");
    state().setName("   ");
    expect(state().name).toMatch(/^Visitor \d{3}$/);
  });

  test("a colour is kept once chosen", () => {
    const { state } = ownStore();
    state().setColor("teal");
    expect(state().color).toBe("teal");
  });

  test("a viewing noted is remembered with when, the later visit winning, and home is the one called home", () => {
    const { state } = ownStore();
    const before = Date.now();
    state().noteViewing("abc");
    state().noteViewing("xyz");
    state().noteViewing("abc");
    expect(Object.keys(state().viewings).sort()).toEqual(["abc", "xyz"]);
    expect(state().viewings["abc"]!.at).toBeGreaterThanOrEqual(before);
    state().setHome("abc");
    expect(state().home).toBe("abc");
  });
});
