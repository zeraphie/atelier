import { describe, expect, test } from "bun:test";
import { colorFor, hueOf, initialOf } from "../src/viewing/color.js";

describe("a person's colour", () => {
  test("is the same for the same name, and a hue within the circle", () => {
    expect(hueOf("Izzy")).toBe(hueOf("Izzy"));
    expect(hueOf("Izzy")).toBeGreaterThanOrEqual(0);
    expect(hueOf("Izzy")).toBeLessThan(360);
    expect(colorFor("Izzy")).toBe(colorFor("Izzy"));
  });

  test("differs between names, and is written in the palette's own terms", () => {
    const names = ["Izzy", "Ren", "Kit", "Visitor 137", "Visitor 138"];
    const hues = new Set(names.map(hueOf));
    expect(hues.size).toBe(names.length);
    expect(colorFor("Ren")).toMatch(/^oklch\(58% 0\.16 \d+\)$/);
  });

  test("an initial is the first letter, capitalised, and nothing for no name", () => {
    expect(initialOf("ren")).toBe("R");
    expect(initialOf("  Izzy")).toBe("I");
    expect(initialOf("")).toBe("");
  });
});
