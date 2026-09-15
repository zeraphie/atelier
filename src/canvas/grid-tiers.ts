/**
 * ─ Grid tiers ─
 *
 * Which spacing the dot grid shows at a zoom. The cells step by fives
 * in round units, so the line dots of one tier are the crossings of
 * the next finer one and nothing moves at a step. A tier changes only
 * once its cell has clearly shrunk below or grown past its band, so a
 * zoom that hovers near a boundary never flickers between two.
 * Decision: DECISIONS.md, a dot grid in metres.
 */

/** Cell sizes in centimetres, finest first: 20 cm, 1 m, 5 m, 25 m. */
export const GRID_CELLS_CM: readonly number[] = [20, 100, 500, 2500];

/** Line dots between one crossing and the next; one fewer than the cells step by. */
export const DOTS_BETWEEN = 4;

// On screen, a cell narrower than this is too dense to read, and a tier
// is chosen only once its cell is at least this wide. The gap between
// the two is the hysteresis.
const TOO_NARROW_PX = 40;
const WIDE_ENOUGH_PX = 48;

const LAST = GRID_CELLS_CM.length - 1;

/** The cell size, in centimetres, of a tier. */
export function gridCellCm(tier: number): number {
  return GRID_CELLS_CM[Math.min(LAST, Math.max(0, tier))] ?? 0;
}

/** The tier (an index into GRID_CELLS_CM) to show at `zoom`, given the one shown now, if any. */
export function gridTier(zoom: number, current?: number): number {
  if (current === undefined) {
    const found = GRID_CELLS_CM.findIndex((cell) => cell * zoom >= WIDE_ENOUGH_PX);
    return found === -1 ? LAST : found;
  }
  const tier = Math.min(LAST, Math.max(0, current));
  if (tier < LAST && gridCellCm(tier) * zoom < TOO_NARROW_PX) {
    return gridTier(zoom, tier + 1);
  }
  if (tier > 0 && gridCellCm(tier - 1) * zoom >= WIDE_ENOUGH_PX) {
    return gridTier(zoom, tier - 1);
  }
  return tier;
}
