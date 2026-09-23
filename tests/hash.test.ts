import { describe, expect, test } from "bun:test";
import { hashForRoom, roomIdFromHash } from "../src/collaboration/hash.js";

describe("the room in the hash", () => {
  test("an id is read out of the hash, with or without its sign, and spaces trimmed", () => {
    expect(roomIdFromHash("#room=abc-123")).toBe("abc-123");
    expect(roomIdFromHash("room=abc")).toBe("abc");
    expect(roomIdFromHash("#room=%20a%20b%20")).toBe("a b");
    expect(roomIdFromHash("#other=1&room=x")).toBe("x");
  });

  test("no room, an empty one, or no hash at all is none", () => {
    expect(roomIdFromHash("")).toBeUndefined();
    expect(roomIdFromHash("#")).toBeUndefined();
    expect(roomIdFromHash("#room=")).toBeUndefined();
    expect(roomIdFromHash("#tour")).toBeUndefined();
  });

  test("the hash for an id round-trips, odd characters included", () => {
    expect(hashForRoom("abc-123")).toBe("#room=abc-123");
    expect(roomIdFromHash(hashForRoom("a b&c"))).toBe("a b&c");
  });
});
