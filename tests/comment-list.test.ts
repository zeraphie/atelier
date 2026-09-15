import { describe, expect, test } from "bun:test";
import { filterThreads, groupByRoom } from "../src/comments/list.js";
import type { Thread } from "../src/comments/model.js";
import { hangGallery, type Spacing } from "../src/gallery/hang.js";
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
  return { id, name: id.toUpperCase(), column, row, columns, rows, works: [] };
}

function thread(id: string, x: number, y: number, resolved = false): Thread {
  return {
    id,
    at: { x, y },
    resolved,
    comments: [{ id: `${id}-1`, author: "A", text: id, createdAt: 0 }],
  };
}

// Two rooms side by side, two metres square each, walked a then b.
const plan = hangGallery([room("a", 0, 0, 2, 2), room("b", 2, 0, 2, 2)], spacing);

describe("filterThreads", () => {
  const threads = [thread("t1", 0, 0), thread("t2", 0, 0, true)];

  test("open keeps the unresolved, resolved the resolved, all keeps every one", () => {
    expect(filterThreads(threads, "open").map((t) => t.id)).toEqual(["t1"]);
    expect(filterThreads(threads, "resolved").map((t) => t.id)).toEqual(["t2"]);
    expect(filterThreads(threads, "all")).toBe(threads);
  });
});

describe("groupByRoom", () => {
  test("groups by the room under the pin, in the plan's order, whatever the threads' order", () => {
    const groups = groupByRoom(plan, [
      thread("in-b", 300, 100),
      thread("in-a", 100, 100),
      thread("in-a-too", 50, 50),
    ]);
    expect(groups.map((g) => g.id)).toEqual(["a", "b"]);
    expect(groups[0]?.name).toBe("A");
    expect(groups[0]?.threads.map((t) => t.id)).toEqual(["in-a", "in-a-too"]);
    expect(groups[1]?.threads.map((t) => t.id)).toEqual(["in-b"]);
  });

  test("a pin in no room is listed last, under its own heading", () => {
    const groups = groupByRoom(plan, [thread("lost", 900, 900), thread("in-b", 300, 100)]);
    expect(groups.map((g) => g.id)).toEqual(["b", "outside"]);
    expect(groups[1]?.name).toBe("Outside the rooms");
  });

  test("leaves out rooms with no threads, and is empty with none", () => {
    expect(groupByRoom(plan, [thread("in-b", 300, 100)]).map((g) => g.id)).toEqual(["b"]);
    expect(groupByRoom(plan, [])).toEqual([]);
  });
});
