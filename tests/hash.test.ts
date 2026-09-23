import { describe, expect, test } from "bun:test";
import { hashForViewing, viewingCodeFromHash } from "../src/viewing/hash.js";

describe("the viewing in the hash", () => {
  test("a code is read out of the hash, with or without its sign, and spaces trimmed", () => {
    expect(viewingCodeFromHash("#viewing=abc-123")).toBe("abc-123");
    expect(viewingCodeFromHash("viewing=abc")).toBe("abc");
    expect(viewingCodeFromHash("#viewing=%20a%20b%20")).toBe("a b");
    expect(viewingCodeFromHash("#other=1&viewing=x")).toBe("x");
  });

  test("no viewing, an empty one, or no hash at all is none", () => {
    expect(viewingCodeFromHash("")).toBeUndefined();
    expect(viewingCodeFromHash("#")).toBeUndefined();
    expect(viewingCodeFromHash("#viewing=")).toBeUndefined();
    expect(viewingCodeFromHash("#tour")).toBeUndefined();
  });

  test("the hash for a code round-trips, odd characters included", () => {
    expect(hashForViewing("abc-123")).toBe("#viewing=abc-123");
    expect(viewingCodeFromHash(hashForViewing("a b&c"))).toBe("a b&c");
  });
});
