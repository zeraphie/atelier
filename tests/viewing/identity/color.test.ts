import { describe, expect, test } from "bun:test";
import {
  colorFor,
  colorOf,
  hueOf,
  initialOf,
  PALETTE,
  swatchFor,
} from "../../../src/viewing/identity/color.js";

describe("the eight colours", () => {
  test("turn from the blue in equal steps, in the rainbow's order, all at one lightness and chroma", () => {
    expect(PALETTE.map((swatch) => swatch.id)).toEqual([
      "red",
      "orange",
      "yellow",
      "green",
      "teal",
      "blue",
      "purple",
      "pink",
    ]);
    const hues = PALETTE.map((swatch) => swatch.hue);
    for (let i = 1; i < hues.length; i += 1) {
      expect(hues[i]! - hues[i - 1]!).toBeCloseTo(45, 6);
    }
    expect(colorOf("blue")).toBe("oklch(60% 0.14 241.5)");
    expect(colorOf("nothing")).toBe(colorOf("blue"));
  });

  test("a name lands on the swatch nearest the hue it hashes to, the same every time", () => {
    for (const name of ["Izzy", "Ren", "Kit", "Visitor 137"]) {
      const swatch = swatchFor(name);
      const hue = hueOf(name);
      const nearest = Math.min(...PALETTE.map((known) => Math.abs(known.hue - hue) % 360));
      expect(Math.abs(swatch.hue - hue) % 360).toBeCloseTo(nearest, 6);
      expect(swatchFor(name)).toEqual(swatch);
    }
    expect(colorFor("Izzy")).toBe(colorOf(swatchFor("Izzy").id));
    expect(colorFor("Izzy", "pink")).toBe(colorOf("pink"));
  });

  test("an initial is the first letter, capitalised, and nothing for no name", () => {
    expect(initialOf("ren")).toBe("R");
    expect(initialOf("  Izzy")).toBe("I");
    expect(initialOf("")).toBe("");
  });
});
