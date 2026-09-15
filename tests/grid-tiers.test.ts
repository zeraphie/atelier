import { describe, expect, test } from "bun:test";
import { GRID_CELLS_CM, gridCellCm, gridTier, smallDotAlpha } from "../src/canvas/grid-tiers.js";

describe("gridTier", () => {
  test("with no tier yet, picks the finest cell at least 48 px wide", () => {
    expect(gridTier(1)).toBe(1);
    expect(gridTier(3)).toBe(0);
    expect(gridTier(0.03)).toBe(3);
  });

  test("with nothing wide enough, picks the coarsest", () => {
    expect(gridTier(0.001)).toBe(GRID_CELLS_CM.length - 1);
  });

  test("keeps a tier whose cell is still readable, even where a fresh pick would differ", () => {
    expect(gridTier(0.45)).toBe(2);
    expect(gridTier(0.45, 1)).toBe(1);
  });

  test("steps coarser once the cell is too narrow", () => {
    expect(gridTier(0.3, 1)).toBe(2);
  });

  test("steps finer once the finer cell is wide enough, and not before", () => {
    expect(gridTier(2.3, 1)).toBe(1);
    expect(gridTier(2.4, 1)).toBe(0);
  });

  test("steps more than one tier at once for a big jump", () => {
    expect(gridTier(0.01, 0)).toBe(3);
    expect(gridTier(10, 3)).toBe(0);
  });

  test("never leaves the ends", () => {
    expect(gridTier(0.0001, 3)).toBe(3);
    expect(gridTier(100, 0)).toBe(0);
  });

  test("each tier's line dots are the next finer tier's crossings", () => {
    for (let tier = 1; tier < GRID_CELLS_CM.length; tier += 1) {
      expect(gridCellCm(tier) / gridCellCm(tier - 1)).toBe(5);
    }
  });
});

describe("smallDotAlpha", () => {
  test("is nothing when the dots crowd, everything once they have room, and between in between", () => {
    expect(smallDotAlpha(8)).toBe(0);
    expect(smallDotAlpha(4)).toBe(0);
    expect(smallDotAlpha(12)).toBe(0.5);
    expect(smallDotAlpha(16)).toBe(1);
    expect(smallDotAlpha(48)).toBe(1);
  });

  test("the dots have faded before the spacing steps coarser, so the step is not seen", () => {
    // The tier steps coarser under a 40 px cell, when the small dots are 8 px apart.
    expect(smallDotAlpha(40 / 5)).toBe(0);
  });
});
