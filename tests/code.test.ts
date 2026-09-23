import { describe, expect, test } from "bun:test";
import { CODE_LENGTH, isViewingCode, newViewingCode, suggestedCode } from "../src/viewing/code.js";

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

describe("suggestedCode", () => {
  const make = () => "fresh123";

  test("the address first, then home, then the viewing last visited, then a new one", () => {
    expect(suggestedCode("link1234", "home1234", { old12345: { at: 5 } }, make)).toEqual({
      code: "link1234",
      isNew: false,
    });
    expect(suggestedCode(undefined, "home1234", { old12345: { at: 5 } }, make)).toEqual({
      code: "home1234",
      isNew: false,
    });
    expect(
      suggestedCode(undefined, undefined, { older123: { at: 5 }, later123: { at: 9 } }, make)
    ).toEqual({ code: "later123", isNew: false });
    expect(suggestedCode(undefined, undefined, {}, make)).toEqual({
      code: "fresh123",
      isNew: true,
    });
  });
});
