import { describe, expect, test } from "bun:test";
import { ValueStore } from "../../src/canvas/value-store.js";

describe("ValueStore", () => {
  test("holds the value it was given and the one set after", () => {
    const store = new ValueStore(1);
    expect(store.current).toBe(1);
    store.set(2);
    expect(store.current).toBe(2);
  });

  test("tells every listener about a change, and none about the same value again", () => {
    const store = new ValueStore("a");
    const heard: string[] = [];
    store.subscribe((value) => heard.push(value));
    store.subscribe((value) => heard.push(value.toUpperCase()));
    store.set("b");
    store.set("b");
    expect(heard).toEqual(["b", "B"]);
  });

  test("an unsubscribed listener hears nothing more", () => {
    const store = new ValueStore(0);
    let heard = 0;
    const stop = store.subscribe(() => {
      heard += 1;
    });
    store.set(1);
    stop();
    store.set(2);
    expect(heard).toBe(1);
  });
});
