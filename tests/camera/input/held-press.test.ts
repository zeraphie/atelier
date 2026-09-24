import { describe, expect, test } from "bun:test";
import { HeldPress } from "../../../src/camera/input/held-press.js";

const yes = () => true;
const no = () => false;

describe("HeldPress", () => {
  test("a left press the owner takes and holds is held, and later events by that pointer are its own", () => {
    const press = new HeldPress();
    expect(press.down(7, 0, yes, yes)).toBe("held");
    expect(press.isHeld).toBe(true);
    expect(press.is(7)).toBe(true);
    expect(press.is(8)).toBe(false);
  });

  test("another button, or a press while one is held, is not the session's at all", () => {
    const press = new HeldPress();
    expect(press.down(7, 2, yes, yes)).toBe("ignored");
    press.down(7, 0, yes, yes);
    expect(press.down(8, 0, yes, yes)).toBe("ignored");
    expect(press.is(8)).toBe(false);
  });

  test("a press the owner refuses goes on to the camera; one taken for a click is not held", () => {
    const press = new HeldPress();
    expect(press.down(7, 0, no, yes)).toBe("refused");
    expect(press.down(7, 0, yes, no)).toBe("taken");
    expect(press.isHeld).toBe(false);
  });

  test("letting go is once: true for the press held, false after, and false with none", () => {
    const press = new HeldPress();
    expect(press.let()).toBe(false);
    press.down(7, 0, yes, yes);
    expect(press.let()).toBe(true);
    expect(press.let()).toBe(false);
    expect(press.is(7)).toBe(false);
  });
});
