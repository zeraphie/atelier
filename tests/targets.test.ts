import { describe, expect, test } from "bun:test";
import { hangGallery, type Spacing } from "../src/gallery/layout/hang.js";
import { targetAt } from "../src/gallery/layout/targets.js";
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

const work: Work = {
  id: "w",
  title: "w",
  artist: "",
  year: "",
  medium: "",
  widthCm: 30,
  heightCm: 30,
  collection: "",
  source: "",
};
const room: Room = { id: "a", name: "a", column: 0, row: 0, columns: 2, rows: 2, works: [work] };
const plan = hangGallery([room], spacing);

describe("targetAt", () => {
  test("a work first, then its room, then the plan", () => {
    const hung = plan.rooms[0]!.works[0]!;
    const onWork = {
      x: (hung.rect.left + hung.rect.right) / 2,
      y: (hung.rect.top + hung.rect.bottom) / 2,
    };
    expect(targetAt(plan, onWork)).toEqual({ kind: "work", work: hung });
    expect(targetAt(plan, { x: 100, y: 150 })).toEqual({ kind: "room", room: plan.rooms[0]! });
    expect(targetAt(plan, { x: 500, y: 500 })).toEqual({ kind: "plan" });
  });
});
