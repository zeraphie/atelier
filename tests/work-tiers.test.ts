import { describe, expect, test } from "bun:test";
import { imageSizeFor, workTier, type ImageSize } from "../src/gallery/tiers.js";

describe("workTier", () => {
  test("a work too small to read stays far", () => {
    expect(workTier(30)).toBe("far");
  });

  test("enters mid a little past where it leaves it", () => {
    expect(workTier(50, "far")).toBe("far");
    expect(workTier(56, "far")).toBe("mid");
    expect(workTier(50, "mid")).toBe("mid");
    expect(workTier(47, "mid")).toBe("far");
  });

  test("enters near a little past where it leaves it", () => {
    expect(workTier(420, "mid")).toBe("mid");
    expect(workTier(440, "mid")).toBe("near");
    expect(workTier(420, "near")).toBe("near");
    expect(workTier(399, "near")).toBe("mid");
  });

  test("a big jump crosses two tiers at once", () => {
    expect(workTier(1000, "far")).toBe("near");
    expect(workTier(10, "near")).toBe("far");
  });
});

describe("imageSizeFor", () => {
  const sizes: ImageSize[] = [
    { px: 512, width: 512, height: 344 },
    { px: 1024, width: 1024, height: 689 },
    { px: 2048, width: 2048, height: 1377 },
  ];

  test("picks the smallest size that covers the device width", () => {
    expect(imageSizeFor(sizes, 300).px).toBe(512);
    expect(imageSizeFor(sizes, 512).px).toBe(512);
    expect(imageSizeFor(sizes, 513).px).toBe(1024);
    expect(imageSizeFor(sizes, 2000).px).toBe(2048);
  });

  test("past the largest, the largest", () => {
    expect(imageSizeFor(sizes, 9000).px).toBe(2048);
  });

  test("an empty set is a fault, not a guess", () => {
    expect(() => imageSizeFor([], 100)).toThrow();
  });
});
