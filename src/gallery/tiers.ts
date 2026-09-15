/**
 * ─ Tiers ─
 *
 * How much of a work to show, from how big it is on screen: far is a
 * block in its own colour, mid the picture and its title, near the
 * label too. A tier is entered a little past where it is left, so a
 * zoom that hovers on a boundary never flickers. The picture itself
 * comes from an image set, chosen the way a browser chooses from a
 * srcset: the smallest size whose pixels cover the work on the device.
 * Decision: DECISIONS.md, levels of detail by zoom.
 */

export type WorkTier = "far" | "mid" | "near";

export interface ImageSize {
  /** The size's name: its long edge, as in the file name. */
  readonly px: number;
  readonly width: number;
  readonly height: number;
}

/** What images.json says about one work's pictures. */
export interface ImageEntry {
  /** The picture's dominant colour, for the far tier. */
  readonly color: string;
  readonly width: number;
  readonly height: number;
  /** Smallest first. */
  readonly sizes: readonly ImageSize[];
}

// Screen widths, in CSS pixels, at which a tier is entered and left.
const MID_ENTER_PX = 56;
const MID_LEAVE_PX = 48;
const NEAR_ENTER_PX = 440;
const NEAR_LEAVE_PX = 400;

/** The tier for a work `screenWidth` pixels wide, given the tier it shows now. */
export function workTier(screenWidth: number, current: WorkTier = "far"): WorkTier {
  if (current === "far") {
    return screenWidth >= MID_ENTER_PX ? workTier(screenWidth, "mid") : "far";
  }
  if (current === "mid") {
    if (screenWidth < MID_LEAVE_PX) {
      return "far";
    }
    return screenWidth >= NEAR_ENTER_PX ? "near" : "mid";
  }
  return screenWidth < NEAR_LEAVE_PX ? workTier(screenWidth, "mid") : "near";
}

/** The smallest size whose width covers `deviceWidth` pixels, or the largest there is. */
export function imageSizeFor(sizes: readonly ImageSize[], deviceWidth: number): ImageSize {
  const enough = sizes.find((size) => size.width >= deviceWidth);
  const largest = sizes[sizes.length - 1];
  if (enough !== undefined) {
    return enough;
  }
  if (largest === undefined) {
    throw new Error("a work needs at least one image size");
  }
  return largest;
}
