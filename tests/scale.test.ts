import { describe, expect, test } from "bun:test";
import { hangGallery, type Spacing } from "../src/gallery/hang.js";
import { cornerNear, cornerPoint, scaled } from "../src/gallery/scale.js";
import type { Room, Work } from "../src/gallery/works.js";

const spacing: Spacing = {
  unitCm: 100,
  gapCm: 10,
  standoffCm: 5,
  endMarginCm: 20,
  headroomCm: 10,
  wallCm: 4,
  doorCm: 20,
};

function work(id: string, widthCm: number, heightCm: number, pictureId?: string): Work {
  return {
    id,
    title: id,
    artist: "",
    year: "",
    medium: "",
    widthCm,
    heightCm,
    collection: "",
    source: "",
    ...(pictureId === undefined ? {} : { pictureId }),
  };
}

// A room with a gallery work and a picture of your own, both placed by hand.
const room: Room = {
  id: "a",
  name: "a",
  column: 0,
  row: 0,
  columns: 4,
  rows: 4,
  works: [work("g", 80, 40), work("p", 80, 40, "pic")],
};
const plan = hangGallery([room], spacing, {
  placed: { g: { x: 100, y: 100 }, p: { x: 300, y: 300 } },
});
// p's rect: 260..340 by 280..320.

describe("cornerNear", () => {
  test("the nearest corner of a picture of your own, within reach and its own quarter", () => {
    expect(cornerNear(plan, { x: 338, y: 318 }, 8)?.corner).toBe("se");
    expect(cornerNear(plan, { x: 262, y: 282 }, 8)?.corner).toBe("nw");
    expect(cornerNear(plan, { x: 300, y: 300 }, 100)).toBeUndefined();
    expect(cornerNear(plan, { x: 335, y: 283 }, 100)?.corner).toBe("ne");
    expect(cornerNear(plan, { x: 330, y: 285 }, 100)).toBeUndefined();
  });

  test("a gallery work has no corner to take", () => {
    expect(cornerNear(plan, { x: 138, y: 118 }, 8)).toBeUndefined();
  });
});

describe("scaled", () => {
  const rect = { left: 260, top: 280, right: 340, bottom: 320 };

  test("the opposite corner holds still and the proportions keep, to whichever side the pointer asks more of", () => {
    expect(scaled(rect, "se", { x: 420, y: 300 }, 10)).toEqual({
      left: 260,
      top: 280,
      right: 420,
      bottom: 360,
    });
    expect(scaled(rect, "nw", { x: 300, y: 300 }, 10)).toEqual({
      left: 300,
      top: 300,
      right: 340,
      bottom: 320,
    });
    expect(scaled(rect, "ne", { x: 300, y: 200 }, 10)).toEqual({
      left: 260,
      top: 200,
      right: 500,
      bottom: 320,
    });
  });

  test("never narrower than the least width, even past the anchor", () => {
    expect(scaled(rect, "se", { x: 200, y: 200 }, 10)).toEqual({
      left: 260,
      top: 280,
      right: 270,
      bottom: 285,
    });
    expect(cornerPoint(rect, "sw")).toEqual({ x: 260, y: 320 });
  });
});
