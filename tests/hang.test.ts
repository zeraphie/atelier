import { describe, expect, test } from "bun:test";
import { hangGallery, type Segment, type Spacing } from "../src/gallery/hang.js";
import type { Room, Work } from "../src/gallery/works.js";

const spacing: Spacing = {
  gapCm: 10,
  paddingCm: 20,
  headroomCm: 5,
  leastRoomCm: 50,
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

function room(id: string, column: number, row: number, works: Work[] = []): Room {
  return { id, name: id, column, row, works };
}

const length = (s: Segment): number => Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);

describe("hangGallery", () => {
  test("works hang on one centre line, in order, a gap apart, centred in the room", () => {
    const { rooms } = hangGallery(
      [room("a", 0, 0, [work("w1", 40, 30), work("w2", 20, 50)])],
      spacing
    );
    const { rect, works } = rooms[0]!;
    const [w1, w2] = works;
    expect(w1!.rect.right - w1!.rect.left).toBe(40);
    expect(w2!.rect.left - w1!.rect.right).toBe(10);
    expect((w1!.rect.top + w1!.rect.bottom) / 2).toBe((w2!.rect.top + w2!.rect.bottom) / 2);
    expect(w1!.rect.left - rect.left).toBe(rect.right - w2!.rect.right);
  });

  test("a room is its works plus the padding and headroom, and never less than the least", () => {
    const { rooms } = hangGallery(
      [room("a", 0, 0, [work("w1", 40, 30), work("w2", 20, 50)]), room("b", 1, 0)],
      spacing
    );
    const [a, b] = rooms;
    expect(a!.rect.right - a!.rect.left).toBe(70 + 40);
    expect(a!.rect.bottom - a!.rect.top).toBe(50 + 40 + 5);
    expect(b!.rect.right - b!.rect.left).toBe(50);
  });

  test("rooms share walls: a column is as wide as its widest room and the next starts where it ends", () => {
    const { rooms } = hangGallery(
      [room("a", 0, 0, [work("w1", 100, 20)]), room("b", 0, 1), room("c", 1, 1)],
      spacing
    );
    const [a, b, c] = rooms;
    expect(b!.rect.right - b!.rect.left).toBe(a!.rect.right - a!.rect.left);
    expect(c!.rect.left).toBe(b!.rect.right);
    expect(b!.rect.top).toBe(a!.rect.bottom);
  });

  test("the tour gets a doorway in each shared wall, and an entrance in the first room's bottom wall", () => {
    const { rooms, doorways } = hangGallery([room("a", 0, 0), room("b", 1, 0)], spacing);
    const [entrance, door] = doorways;
    expect(entrance!.from).toBe("outside");
    expect(entrance!.gap.a.y).toBe(rooms[0]!.rect.bottom);
    expect(length(entrance!.gap)).toBe(20);
    expect(door!.from).toBe("a");
    expect(door!.to).toBe("b");
    expect(door!.gap.a.x).toBe(rooms[0]!.rect.right);
    expect(length(door!.gap)).toBe(20);
  });

  test("a tour between rooms that share no wall is a fault", () => {
    expect(() => hangGallery([room("a", 0, 0), room("b", 1, 1)], spacing)).toThrow(/share no wall/);
  });

  test("walls are each edge once, with the doorways cut out a wall wider", () => {
    const { walls } = hangGallery([room("a", 0, 0), room("b", 1, 0)], spacing);
    // Two rooms side by side: seven edges, and the shared one drawn once.
    const shared = walls.filter((w) => w.a.x === 50 && w.b.x === 50);
    expect(shared).toHaveLength(2);
    const gap = 50 - shared.reduce((sum, w) => sum + length(w), 0);
    expect(gap).toBe(20 + 4);
    const bottom = walls.filter((w) => w.a.y === 50 && w.b.y === 50);
    expect(bottom.reduce((sum, w) => sum + length(w), 0)).toBe(100 - 24);
  });

  test("the bounds wrap every room", () => {
    const { rooms, bounds } = hangGallery(
      [room("a", 0, 0), room("b", 1, 0), room("c", 1, 1)],
      spacing
    );
    expect(bounds.left).toBe(rooms[0]!.rect.left);
    expect(bounds.right).toBe(rooms[2]!.rect.right);
    expect(bounds.bottom).toBe(rooms[2]!.rect.bottom);
  });
});
