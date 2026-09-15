/**
 * ─ Keys ─
 *
 * Which key means what, as a table with no side effects: the
 * shortcuts hook turns a key press into a name here and acts on the
 * name there. Letters and signs match the character typed, so a
 * layout that puts them elsewhere still has them; the digit keys
 * match their position, since Shift changes what a digit key types.
 */

export type KeyAction =
  | "comment"
  | "escape"
  | "next"
  | "previous"
  | "zoomIn"
  | "zoomOut"
  | "actualSize"
  | "fit";

/** The parts of a keyboard event the table reads. */
export interface KeyPress {
  readonly key: string;
  readonly code: string;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
}

/** The action a press asks for, or none: a press with Ctrl, Command or Alt is the browser's. */
export function keyActionFor(press: KeyPress): KeyAction | undefined {
  if (press.ctrlKey || press.metaKey || press.altKey) {
    return undefined;
  }
  if (press.shiftKey) {
    if (press.code === "Digit1") {
      return "fit";
    }
    if (press.code === "Digit0") {
      return "actualSize";
    }
    return press.key === "+" ? "zoomIn" : undefined;
  }
  switch (press.key) {
    case "c":
    case "C":
      return "comment";
    case "Escape":
      return "escape";
    case "ArrowRight":
      return "next";
    case "ArrowLeft":
      return "previous";
    case "+":
    case "=":
      return "zoomIn";
    case "-":
      return "zoomOut";
    default:
      return undefined;
  }
}
