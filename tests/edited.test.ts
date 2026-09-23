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

describe("applyEdits, a room removed again", () => {
  test("a drawn room whose drawing was marked false is no room", () => {
    const edited = applyEdits(base, {
      rooms: {
        gone: {
          drawn: { value: false, at: 30 },
          cells: { value: { column: 6, row: 0, columns: 2, rows: 2 }, at: 20 },
        },
        kept: {
          drawn: { value: true, at: 40 },
          cells: { value: { column: 8, row: 0, columns: 2, rows: 2 }, at: 40 },
        },
      },
      doorways: {},
      placed: {},
    });
    expect(edited.rooms.map((room) => room.id)).toEqual(["a", "b", "kept"]);
  });
});

describe("applyEdits, pictures of your own", () => {
  const record = {
    id: "pic",
    title: "Bridge",
    artist: "M",
    year: "1991",
    credit: "LoC",
    description: "A drawing",
    widthCm: 60,
    heightCm: 40,
    color: "#cccccc",
    size: { width: 1024, height: 683 },
  };
  const hanging = (id: string, at: { x: number; y: number }, pictureId = "pic") => ({
    value: { id, pictureId, at, widthCm: 60 },
    at: 10,
  });

  test("a hanging is a work of the room its point is in, placed there, at the picture's proportions", () => {
    const edited = applyEdits(base, {
      rooms: {},
      doorways: {},
      placed: {},
      hangings: { h1: hanging("h1", { x: 250, y: 100 }) },
      pictures: { pic: record },
    });
    expect(edited.rooms[0]!.works).toEqual([]);
    expect(edited.rooms[1]!.works.map((work) => work.id)).toEqual(["h1"]);
    expect(edited.rooms[1]!.works[0]).toMatchObject({
      title: "Bridge",
      widthCm: 60,
      heightCm: 40,
      medium: "A drawing",
      collection: "LoC",
      pictureId: "pic",
    });
    expect(edited.placed["h1"]).toEqual({ x: 250, y: 100 });
  });

  test("a point it was moved to wins; one taken down, of an unknown picture, or outside every room is no work", () => {
    const edited = applyEdits(base, {
      rooms: {},
      doorways: {},
      placed: { h1: { value: { x: 50, y: 50 }, at: 20 } },
      hangings: {
        h1: hanging("h1", { x: 250, y: 100 }),
        h2: { value: null, at: 10 },
        h3: hanging("h3", { x: 100, y: 100 }, "nope"),
        h4: hanging("h4", { x: 900, y: 900 }),
      },
      pictures: { pic: record },
    });
    expect(edited.rooms[0]!.works.map((work) => work.id)).toEqual(["h1"]);
    expect(edited.rooms[1]!.works).toEqual([]);
    expect(edited.placed["h1"]).toEqual({ x: 50, y: 50 });
    expect(edited.placed["h4"]).toBeUndefined();
  });
});
