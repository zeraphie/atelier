import { describe, expect, test } from "bun:test";
import { filterThreads, groupByRoom } from "../../src/comments/list.js";
import { hangGallery } from "../../src/gallery/layout/hang.js";
import { SPACING, room, thread } from "../fixtures.js";

// Two rooms side by side, two metres square each, walked a then b.
const plan = hangGallery([room("a", 0, 0, 2, 2), room("b", 2, 0, 2, 2)], SPACING);

describe("filterThreads", () => {
  const threads = [thread("t1"), thread("t2", { resolved: true })];

  test("open keeps the unresolved, resolved the resolved, all keeps every one", () => {
    expect(filterThreads(threads, "open").map((t) => t.id)).toEqual(["t1"]);
    expect(filterThreads(threads, "resolved").map((t) => t.id)).toEqual(["t2"]);
    expect(filterThreads(threads, "all")).toBe(threads);
  });
});

describe("groupByRoom", () => {
  test("groups by the room under the pin, in the plan's order, whatever the threads' order", () => {
    const groups = groupByRoom(plan, [
      thread("in-b", { at: { x: 300, y: 100 } }),
      thread("in-a", { at: { x: 100, y: 100 } }),
      thread("in-a-too", { at: { x: 50, y: 50 } }),
    ]);
    expect(groups.map((g) => g.id)).toEqual(["a", "b"]);
    expect(groups[0]?.name).toBe("a");
    expect(groups[0]?.threads.map((t) => t.id)).toEqual(["in-a", "in-a-too"]);
    expect(groups[1]?.threads.map((t) => t.id)).toEqual(["in-b"]);
  });

  test("a pin in no room is listed last, under its own heading", () => {
    const groups = groupByRoom(plan, [
      thread("lost", { at: { x: 900, y: 900 } }),
      thread("in-b", { at: { x: 300, y: 100 } }),
    ]);
    expect(groups.map((g) => g.id)).toEqual(["b", "outside"]);
    expect(groups[1]?.name).toBe("Outside the rooms");
  });

  test("leaves out rooms with no threads, and is empty with none", () => {
    expect(
      groupByRoom(plan, [thread("in-b", { at: { x: 300, y: 100 } })]).map((g) => g.id)
    ).toEqual(["b"]);
    expect(groupByRoom(plan, [])).toEqual([]);
  });
});
