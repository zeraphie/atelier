import { describe, expect, test } from "bun:test";
import { hangGallery, type Spacing } from "../src/gallery/hang.js";
import type { Room, Work } from "../src/gallery/works.js";

const spacing: Spacing = { gapCm: 10, paddingCm: 20, headroomCm: 5, corridorCm: 100 };

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

function room(id: string, column: number, row: number, works: Work[]): Room {
  return { id, name: id, column, row, works };
}

describe("hangGallery", () => {
  test("works hang on one centre line, in order, a gap apart", () => {
    const { rooms } = hangGallery(
      [room("a", 0, 0, [work("w1", 40, 30), work("w2", 20, 50)])],
      spacing
    );
    const [w1, w2] = rooms[0]!.works;
    expect(w1!.rect.right - w1!.rect.left).toBe(40);
    expect(w2!.rect.left - w1!.rect.right).toBe(10);
    expect((w1!.rect.top + w1!.rect.bottom) / 2).toBe((w2!.rect.top + w2!.rect.bottom) / 2);
  });

  test("a room wraps its works with the padding, and headroom above for its name", () => {
    const { rooms } = hangGallery(
      [room("a", 0, 0, [work("w1", 40, 30), work("w2", 20, 50)])],
      spacing
    );
    const { rect, works } = rooms[0]!;
    expect(works[0]!.rect.left - rect.left).toBe(20);
    expect(rect.right - works[1]!.rect.right).toBe(20);
    expect(rect.bottom - works[1]!.rect.bottom).toBe(20);
    expect(works[1]!.rect.top - rect.top).toBe(25);
  });

  test("rooms in one row sit a corridor apart, top-aligned, and a column is as wide as its widest room", () => {
    const { rooms } = hangGallery(
      [
        room("a", 0, 0, [work("w1", 40, 30)]),
        room("b", 1, 0, [work("w2", 20, 20)]),
        room("c", 0, 1, [work("w3", 100, 20)]),
      ],
      spacing
    );
    const [a, b, c] = rooms;
    expect(a!.rect.top).toBe(b!.rect.top);
    // Column 0 is as wide as room c, so b starts after that width and the corridor.
    expect(b!.rect.left).toBe(c!.rect.right - c!.rect.left + 100);
    expect(a!.rect.left).toBe(0);
  });

  test("a room in the next row sits below the tallest room of the row above, a corridor apart", () => {
    const { rooms } = hangGallery(
      [
        room("a", 0, 0, [work("w1", 40, 30)]),
        room("b", 1, 0, [work("w2", 20, 80)]),
        room("c", 0, 1, [work("w3", 30, 20)]),
      ],
      spacing
    );
    const [, b, c] = rooms;
    expect(c!.rect.top).toBe(b!.rect.bottom - b!.rect.top + 100);
  });

  test("the bounds wrap every room", () => {
    const { rooms, bounds } = hangGallery(
      [room("a", 0, 0, [work("w1", 40, 30)]), room("b", 1, 0, [work("w2", 20, 80)])],
      spacing
    );
    expect(bounds.left).toBe(rooms[0]!.rect.left);
    expect(bounds.right).toBe(rooms[1]!.rect.right);
    expect(bounds.top).toBe(Math.min(rooms[0]!.rect.top, rooms[1]!.rect.top));
    expect(bounds.bottom).toBe(Math.max(rooms[0]!.rect.bottom, rooms[1]!.rect.bottom));
  });
});
