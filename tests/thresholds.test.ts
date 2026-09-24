import { describe, expect, test } from "bun:test";
import { hangGallery, type Spacing } from "../src/gallery/layout/hang.js";
import { STAND_BACK_CM, thresholdsOf } from "../src/gallery/route/thresholds.js";
import type { Room } from "../src/gallery/works.js";

const spacing: Spacing = {
  unitCm: 100,
  gapCm: 10,
  standoffCm: 5,
  endMarginCm: 20,
  headroomCm: 10,
  wallCm: 4,
  doorCm: 20,
};

function room(id: string, column: number, row: number, columns: number, rows: number): Room {
  return { id, name: id, column, row, columns, rows, works: [] };
}

describe("thresholdsOf", () => {
  test("one arrow per doorway between rooms, none for the entrance", () => {
    const plan = hangGallery(
      [room("a", 0, 0, 2, 2), room("b", 2, 0, 2, 2), room("c", 2, 2, 2, 2)],
      spacing
    );
    const arrows = thresholdsOf(plan);
    expect(plan.doorways).toHaveLength(3);
    expect(arrows.map((t) => `${t.from.room.id}>${t.to.room.id}`)).toEqual(["a>b", "b>c"]);
  });

  test("stands back from the doorway inside the room it leaves, pointing through", () => {
    const plan = hangGallery([room("a", 0, 0, 2, 2), room("b", 2, 0, 2, 2)], spacing);
    const [arrow] = thresholdsOf(plan);
    const door = plan.doorways.find((d) => d.to === "b")!;
    expect(arrow?.direction).toBe("right");
    expect(arrow?.at.x).toBe(200 - STAND_BACK_CM);
    expect(arrow?.at.y).toBe((door.gap.a.y + door.gap.b.y) / 2);
  });

  test("points up through a doorway in the top wall", () => {
    const plan = hangGallery([room("a", 0, 2, 2, 2), room("b", 0, 0, 2, 2)], spacing);
    const [arrow] = thresholdsOf(plan);
    expect(arrow?.direction).toBe("up");
    expect(arrow?.at.y).toBe(200 + STAND_BACK_CM);
  });
});
