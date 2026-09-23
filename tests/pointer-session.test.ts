import { describe, expect, test } from "bun:test";
import { firstOf, type PointerSessionOwner } from "../src/camera/pointer-session.js";

const at = { x: 0, y: 0 };
const event = {} as PointerEvent;

function owner(takes: boolean, holds = true): PointerSessionOwner & { readonly heard: string[] } {
  const heard: string[] = [];
  return {
    heard,
    takes: () => takes,
    onDown: () => {
      heard.push("down");
      return holds;
    },
    onMove: () => {
      heard.push("move");
    },
    onUp: () => {
      heard.push("up");
    },
    onCancel: () => {
      heard.push("cancel");
    },
  };
}

describe("firstOf", () => {
  test("the first owner that takes the press hears the whole drag", () => {
    const first = owner(false);
    const second = owner(true);
    const third = owner(true);
    const owners = firstOf(first, second, third);
    expect(owners.takes(at, event)).toBe(true);
    expect(owners.onDown(at, event)).toBe(true);
    owners.onMove(at, event);
    owners.onUp(at, event);
    expect(first.heard).toEqual([]);
    expect(second.heard).toEqual(["down", "move", "up"]);
    expect(third.heard).toEqual([]);
  });

  test("a cancel reaches the holder, and after it nothing is held", () => {
    const only = owner(true);
    const owners = firstOf(only);
    owners.onDown(at, event);
    owners.onCancel();
    owners.onMove(at, event);
    expect(only.heard).toEqual(["down", "cancel"]);
  });

  test("no owner takes the press, or the taker declines to hold it: nothing is held", () => {
    expect(firstOf(owner(false)).takes(at, event)).toBe(false);
    const declines = owner(true, false);
    const owners = firstOf(declines);
    expect(owners.onDown(at, event)).toBe(false);
    owners.onMove(at, event);
    expect(declines.heard).toEqual(["down"]);
  });
});
