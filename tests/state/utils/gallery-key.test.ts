import { describe, expect, test } from "bun:test";
import { GALLERY_KEY, keyForViewing } from "../../../src/state/utils/gallery-key.js";

describe("keyForViewing", () => {
  test("no viewing is the plain key, and a viewing is the key with its code after a dot", () => {
    expect(keyForViewing(undefined)).toBe(GALLERY_KEY);
    expect(keyForViewing("snap2k9xw")).toBe("atelier.gallery.snap2k9xw");
  });
});
