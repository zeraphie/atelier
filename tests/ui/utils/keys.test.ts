import { describe, expect, test } from "bun:test";
import { keyActionFor, type KeyPress } from "../../../src/ui/utils/keys.js";

function press(key: string, code: string, held: Partial<KeyPress> = {}): KeyPress {
  return { key, code, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...held };
}

describe("keyActionFor", () => {
  test("C in either case asks for comment mode, E for edit mode, and Escape backs out", () => {
    expect(keyActionFor(press("c", "KeyC"))).toBe("comment");
    expect(keyActionFor(press("C", "KeyC"))).toBe("comment");
    expect(keyActionFor(press("e", "KeyE"))).toBe("edit");
    expect(keyActionFor(press("Escape", "Escape"))).toBe("escape");
  });

  test("the arrows step along the tour", () => {
    expect(keyActionFor(press("ArrowRight", "ArrowRight"))).toBe("next");
    expect(keyActionFor(press("ArrowLeft", "ArrowLeft"))).toBe("previous");
  });

  test("plus and minus zoom, whether plus needs Shift or not, and from the number pad", () => {
    expect(keyActionFor(press("=", "Equal"))).toBe("zoomIn");
    expect(keyActionFor(press("+", "Equal", { shiftKey: true }))).toBe("zoomIn");
    expect(keyActionFor(press("+", "NumpadAdd"))).toBe("zoomIn");
    expect(keyActionFor(press("-", "Minus"))).toBe("zoomOut");
    expect(keyActionFor(press("-", "NumpadSubtract"))).toBe("zoomOut");
  });

  test("Shift+1 fits the plan and Shift+0 is life size, by the keys' positions, whatever they type", () => {
    expect(keyActionFor(press("!", "Digit1", { shiftKey: true }))).toBe("fit");
    expect(keyActionFor(press(")", "Digit0", { shiftKey: true }))).toBe("actualSize");
    expect(keyActionFor(press("1", "Digit1"))).toBeUndefined();
    expect(keyActionFor(press("C", "KeyC", { shiftKey: true }))).toBeUndefined();
  });

  test("a press with Ctrl, Command or Alt is left to the browser", () => {
    expect(keyActionFor(press("c", "KeyC", { ctrlKey: true }))).toBeUndefined();
    expect(keyActionFor(press("ArrowRight", "ArrowRight", { metaKey: true }))).toBeUndefined();
    expect(keyActionFor(press("=", "Equal", { ctrlKey: true }))).toBeUndefined();
    expect(keyActionFor(press("Escape", "Escape", { altKey: true }))).toBeUndefined();
  });

  test("any other key is nobody's", () => {
    expect(keyActionFor(press("x", "KeyX"))).toBeUndefined();
  });
  test("Delete and Backspace ask for a removal", () => {
    expect(keyActionFor(press("Delete", "Delete"))).toBe("remove");
    expect(keyActionFor(press("Backspace", "Backspace"))).toBe("remove");
  });
});
