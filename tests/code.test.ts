import { describe, expect, test } from "bun:test";
import { CODE_LENGTH, isViewingCode, newViewingCode } from "../src/viewing/code.js";

describe("a viewing's code", () => {
  test("is eight characters from the alphabet, and two are not the same", () => {
    const code = newViewingCode();
    expect(code).toHaveLength(CODE_LENGTH);
    expect(isViewingCode(code)).toBe(true);
    expect(newViewingCode()).not.toBe(code);
  });

  test("is recognised, and look-alikes and other lengths are not", () => {
    expect(isViewingCode("abcd2345")).toBe(true);
    expect(isViewingCode("abcd0l1o")).toBe(false);
    expect(isViewingCode("abc")).toBe(false);
    expect(isViewingCode("ABCD2345")).toBe(false);
  });
});
