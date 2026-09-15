import { describe, expect, test } from "bun:test";
import { hangGallery, roomAt, workAt, type Segment, type Spacing } from "../src/gallery/hang.js";
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

function work(id: string, widthCm: number, heightCm: number): Work {
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

const length = (s: Segment): number => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
const mid = (s: Segment) => ({ x: (s.a.x + s.b.x) / 2, y: (s.a.y + s.b.y) / 2 });

describe("hangGallery", () => {
  test("a room is its cells on the metre grid", () => {
    const { rooms } = hangGallery([room("a", 2, 1, 3, 2)], spacing);
    expect(rooms[0]!.rect).toEqual({ left: 200, top: 100, right: 500, bottom: 300 });
  });

  test("the entrance is in the first room's bottom wall, a third along from the end nearest the next room", () => {
    const { doorways } = hangGallery([room("a", 0, 0, 3, 2), room("b", 3, 0, 2, 2)], spacing);
    const entrance = doorways[0]!;
    expect(entrance.from).toBe("outside");
    expect(entrance.gap.a.y).toBe(200);
    expect(length(entrance.gap)).toBe(20);
    // The next room is to the right, so a third of the way from the right end.
    expect(mid(entrance.gap).x).toBe(200);
  });

  test("each doorway sits a third along the shared wall from the end farthest from the one before, so the route winds", () => {
    const { doorways } = hangGallery(
      [room("a", 0, 0, 3, 2), room("b", 3, 0, 2, 2), room("c", 3, 2, 2, 2)],
      spacing
    );
    const [entrance, ab, bc] = doorways;
    // The entrance is on a's bottom wall; a to b is on x = 300, so it goes towards the top end.
    expect(ab!.gap.a.x).toBe(300);
    expect(mid(ab!.gap).y).toBeCloseTo(200 / 3, 6);
    expect(mid(entrance!.gap).y).toBe(200);
    // b to c is on y = 200 across x 300..500; the door before is up near the left, so it goes right.
    expect(bc!.gap.a.y).toBe(200);
    expect(mid(bc!.gap).x).toBeCloseTo(500 - 200 / 3, 6);
  });

  test("a tour between rooms that share no wall is a fault", () => {
    expect(() => hangGallery([room("a", 0, 0, 1, 1), room("b", 2, 0, 1, 1)], spacing)).toThrow(
      /share no wall/
    );
  });

  test("works hang on the wall facing the entry first, centred, standing just off it", () => {
    const { rooms } = hangGallery(
      [room("a", 0, 0, 3, 2, [work("w1", 40, 30), work("w2", 20, 50)])],
      spacing
    );
    const [w1, w2] = rooms[0]!.works;
    // Entered from the bottom, so they hang along the top wall, under the headroom.
    expect(w1!.wall).toBe("top");
    expect(w1!.rect.top).toBe(10 + 5);
    expect(w2!.rect.left - w1!.rect.right).toBe(10);
    expect(w1!.rect.left - 0).toBe(300 - w2!.rect.right);
  });

  test("works that do not fit the far wall go on to the walls beside it", () => {
    const wide = [work("w1", 200, 30), work("w2", 200, 250), work("w3", 30, 40)];
    const { rooms } = hangGallery([room("a", 0, 0, 3, 3, wide)], spacing);
    const walls = rooms[0]!.works.map((w) => w.wall);
    expect(walls).toEqual(["top", "left", "right"]);
    expect(rooms[0]!.works[1]!.rect.left).toBe(5);
    expect(rooms[0]!.works[2]!.rect.right).toBe(300 - 5);
  });

  test("the entrance avoids a wall another room is behind", () => {
    const { doorways } = hangGallery([room("a", 0, 0, 3, 2), room("b", 0, 2, 3, 2)], spacing);
    // The bottom is shared with b, so the entrance goes to the left wall.
    expect(doorways[0]!.gap.a.x).toBe(0);
    expect(doorways[0]!.gap.b.x).toBe(0);
  });

  test("works that reach the entry wall are centred on its stretch clear of the door", () => {
    const seven = Array.from({ length: 7 }, (_, i) => work(`w${i}`, 60, 60));
    const { rooms, doorways } = hangGallery([room("a", 0, 0, 2, 2, seven)], spacing);
    const walls = rooms[0]!.works.map((w) => w.wall);
    expect(walls).toEqual(["top", "top", "left", "left", "right", "right", "bottom"]);
    const door = doorways[0]!.gap;
    const last = rooms[0]!.works[6]!.rect;
    const doorEnd = Math.max(door.a.x, door.b.x);
    expect(Math.min(door.a.x, door.b.x)).toBeCloseTo(200 / 3 - 10, 6);
    expect(last.left).toBeGreaterThan(doorEnd);
    expect((last.left + last.right) / 2).toBeCloseTo((doorEnd + 20 + 200 - 20) / 2, 6);
  });

  test("a work that names its wall hangs there, and the rest keep to the rule", () => {
    const named = { ...work("w1", 40, 30), wall: "right" as const };
    const { rooms } = hangGallery([room("a", 0, 0, 3, 2, [named, work("w2", 20, 50)])], spacing);
    const [w1, w2] = rooms[0]!.works;
    expect(w1!.wall).toBe("right");
    expect(w1!.rect.right).toBe(300 - 5);
    expect(w2!.wall).toBe("top");
  });

  test("a work that names a wall with no space for it is a fault", () => {
    const named = { ...work("w1", 400, 30), wall: "top" as const };
    expect(() => hangGallery([room("a", 0, 0, 3, 2, [named])], spacing)).toThrow(
      /no space on its top wall/
    );
  });

  test("a room with no wall left for a work is a fault", () => {
    const many = Array.from({ length: 12 }, (_, i) => work(`w${i}`, 60, 60));
    expect(() => hangGallery([room("a", 0, 0, 2, 2, many)], spacing)).toThrow(/no wall left/);
  });

  test("walls are each edge once, with the doorways cut out a wall wider", () => {
    const { walls } = hangGallery([room("a", 0, 0, 1, 1), room("b", 1, 0, 1, 1)], spacing);
    const shared = walls.filter((w) => w.a.x === 100 && w.b.x === 100);
    expect(shared).toHaveLength(2);
    expect(100 - shared.reduce((sum, w) => sum + length(w), 0)).toBe(20 + 4);
    const bottomOfA = walls.filter((w) => w.a.y === 100 && w.b.y === 100 && w.b.x <= 100);
    expect(bottomOfA.reduce((sum, w) => sum + length(w), 0)).toBe(100 - 24);
  });

  test("finds the work or the room under a point", () => {
    const plan = hangGallery(
      [room("a", 0, 0, 3, 2, [work("w1", 40, 30)]), room("b", 3, 0, 2, 2)],
      spacing
    );
    const w1 = plan.rooms[0]!.works[0]!;
    const inside = { x: (w1.rect.left + w1.rect.right) / 2, y: (w1.rect.top + w1.rect.bottom) / 2 };
    expect(workAt(plan, inside)?.work.id).toBe("w1");
    expect(roomAt(plan, inside)?.room.id).toBe("a");
    expect(workAt(plan, { x: 400, y: 100 })).toBeUndefined();
    expect(roomAt(plan, { x: 400, y: 100 })?.room.id).toBe("b");
    expect(roomAt(plan, { x: 900, y: 900 })).toBeUndefined();
  });

  test("the bounds wrap every room", () => {
    const { bounds } = hangGallery([room("a", 0, 0, 2, 2), room("b", 2, 1, 1, 3)], spacing);
    expect(bounds).toEqual({ left: 0, top: 0, right: 300, bottom: 400 });
  });
});
