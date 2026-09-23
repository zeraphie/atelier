import { describe, expect, test } from "bun:test";
import { applyEdits } from "../src/gallery/edited.js";
import type { Room } from "../src/gallery/works.js";

const base: Room[] = [
  { id: "a", name: "A", column: 0, row: 0, columns: 2, rows: 2, works: [] },
  { id: "b", name: "B", column: 2, row: 0, columns: 2, rows: 2, works: [] },
];

describe("applyEdits", () => {
  test("with no edits, the rooms are the data and nothing is placed", () => {
    const edited = applyEdits(base, { rooms: {}, doorways: {}, placed: {} });
    expect(edited.rooms).toEqual(base);
    expect(edited.placed).toEqual({});
    expect(edited.doorways).toEqual({});
  });

  test("a renamed or resized room replaces its own; an edit for an unknown room is nothing", () => {
    const edited = applyEdits(base, {
      rooms: {
        b: {
          name: { value: "Prints", at: 1 },
          cells: { value: { column: 2, row: 0, columns: 3, rows: 2 }, at: 1 },
        },
        ghost: { name: { value: "Nowhere", at: 1 } },
      },
      doorways: {},
      placed: {},
    });
    expect(edited.rooms.map((room) => room.id)).toEqual(["a", "b"]);
    expect(edited.rooms[1]).toMatchObject({ name: "Prints", columns: 3 });
  });

  test("drawn rooms follow the data in the order they were drawn, and need their cells", () => {
    const cells = (column: number) => ({ column, row: 0, columns: 1, rows: 1 });
    const edited = applyEdits(base, {
      rooms: {
        later: { drawn: { value: true, at: 20 }, cells: { value: cells(6), at: 20 } },
        sooner: {
          drawn: { value: true, at: 10 },
          name: { value: "Annex", at: 10 },
          cells: { value: cells(4), at: 10 },
        },
        empty: { drawn: { value: true, at: 5 } },
      },
      doorways: {},
      placed: {},
    });
    expect(edited.rooms.map((room) => room.id)).toEqual(["a", "b", "sooner", "later"]);
    expect(edited.rooms[2]).toMatchObject({ name: "Annex", column: 4, works: [] });
    expect(edited.rooms[3]?.name).toBe("Room");
  });

  test("placed points and doorway edges come through without their stamps", () => {
    const edited = applyEdits(base, {
      rooms: {},
      doorways: { "a>b": { value: { col: 1, row: 1, side: "east" }, at: 3 } },
      placed: { w: { value: { x: 50, y: 60 }, at: 3 } },
    });
    expect(edited.placed).toEqual({ w: { x: 50, y: 60 } });
    expect(edited.doorways).toEqual({ "a>b": { col: 1, row: 1, side: "east" } });
  });
});
