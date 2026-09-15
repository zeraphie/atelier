import { describe, expect, test } from "bun:test";
import { hangGallery, type Spacing } from "../src/gallery/hang.js";
import { routeThrough } from "../src/gallery/route.js";
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
  const plan = hangGallery(
    [
      room("foyer", 0, 2, 2, 1),
      room("a", 0, 0, 2, 2, [work("w1", 40, 30), work("w2", 30, 30, "left")]),
      room("b", 2, 0, 2, 2, [work("w3", 40, 30)]),
    ],
    spacing
  );
  const route = routeThrough(plan, 25);

  test("starts at the entrance and crosses an empty room through its middle", () => {
    const entrance = plan.doorways[0]!.gap;
    expect(route.path[0]).toEqual({
      x: (entrance.a.x + entrance.b.x) / 2,
      y: (entrance.a.y + entrance.b.y) / 2,
    });
    expect(route.path[1]).toEqual({ x: 100, y: 250 });
  });

  test("passes through each doorway in turn", () => {
    const [, intoA, intoB] = plan.doorways;
    const mid = (g: { a: { x: number; y: number }; b: { x: number; y: number } }) => ({
      x: (g.a.x + g.b.x) / 2,
      y: (g.a.y + g.b.y) / 2,
    });
    expect(route.path).toContainEqual(mid(intoA!.gap));
    expect(route.path).toContainEqual(mid(intoB!.gap));
    expect(
      route.path.findIndex((p) => p.x === mid(intoA!.gap).x && p.y === mid(intoA!.gap).y)
    ).toBeLessThan(
      route.path.findIndex((p) => p.x === mid(intoB!.gap).x && p.y === mid(intoB!.gap).y)
    );
  });

  test("stops at every work in the order the walk meets them, standing off the wall", () => {
    expect(route.stops.map((s) => s.work.work.id)).toEqual(["w1", "w2", "w3"]);
    const w2 = route.stops[1]!;
    expect(w2.work.wall).toBe("left");
    expect(route.path[w2.at]).toEqual({
      x: w2.work.rect.right + 25,
      y: (w2.work.rect.top + w2.work.rect.bottom) / 2,
    });
    const w1 = route.stops[0]!;
    expect(route.path[w1.at]!.y).toBe(w1.work.rect.bottom + 25);
  });
});
