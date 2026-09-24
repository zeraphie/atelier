import { describe, expect, test } from "bun:test";
import { hangGallery, type Spacing } from "../../../src/gallery/layout/hang.js";
import { routeThrough } from "../../../src/gallery/route/route.js";
import type { Room, Work } from "../../../src/gallery/works.js";

const spacing: Spacing = {
  unitCm: 100,
  gapCm: 10,
  standoffCm: 5,
  endMarginCm: 20,
  headroomCm: 10,
  wallCm: 4,
  doorCm: 20,
};

function work(id: string, widthCm: number, heightCm: number, wall?: Work["wall"]): Work {
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
    ...(wall === undefined ? {} : { wall }),
  };
}

function room(
  id: string,
  column: number,
  row: number,
  columns: number,
  rows: number,
  works: Work[] = []
): Room {
  return { id, name: id, column, row, columns, rows, works };
}

describe("routeThrough", () => {
  test("visits the works room by room, and within a room wall by wall from the far wall", () => {
    const plan = hangGallery(
      [
        room("foyer", 0, 2, 2, 1),
        // Entered from below: the far wall is the top, so w1 on the left comes after w2 on the top.
        room("a", 0, 0, 2, 2, [work("w1", 30, 30, "left"), work("w2", 40, 30)]),
        room("b", 2, 0, 2, 2, [work("w3", 40, 30)]),
      ],
      spacing
    );
    const route = routeThrough(plan);
    expect(route.stops.map((s) => s.work.work.id)).toEqual(["w2", "w1", "w3"]);
    expect(route.stops.map((s) => s.room.room.id)).toEqual(["a", "a", "b"]);
  });

  test("an empty room adds no stop", () => {
    const plan = hangGallery([room("a", 0, 0, 2, 2), room("b", 2, 0, 2, 2)], spacing);
    expect(routeThrough(plan).stops).toHaveLength(0);
  });
});
