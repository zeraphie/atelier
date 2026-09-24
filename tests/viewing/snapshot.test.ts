import { describe, expect, test } from "bun:test";
import type { Thread } from "../../src/comments/model.js";
import { mergeSnapshot, snapshotOf, type Snapshot } from "../../src/viewing/snapshot.js";

const empty: Snapshot = {
  threads: [],
  placed: {},
  hangings: {},
  rooms: {},
  doorways: {},
  resetAt: 0,
};

function thread(id: string, text: string, createdAt: number, extra: Partial<Thread> = {}): Thread {
  return {
    id,
    at: { x: 0, y: 0 },
    comments: [{ id: `${id}-1`, author: "a", text, createdAt }],
    resolved: false,
    ...extra,
  };
}

describe("mergeSnapshot", () => {
  test("stamped records take the later stamp, a tie keeps mine, and the rest of both stay", () => {
    const merged = mergeSnapshot(
      {
        ...empty,
        placed: { w: { value: { x: 1, y: 1 }, at: 10 }, v: { value: { x: 5, y: 5 }, at: 10 } },
      },
      {
        ...empty,
        placed: {
          w: { value: { x: 2, y: 2 }, at: 20 },
          v: { value: { x: 6, y: 6 }, at: 10 },
          u: { value: { x: 9, y: 9 }, at: 5 },
        },
      }
    );
    expect(merged.placed["w"]?.value).toEqual({ x: 2, y: 2 });
    expect(merged.placed["v"]?.value).toEqual({ x: 5, y: 5 });
    expect(merged.placed["u"]?.value).toEqual({ x: 9, y: 9 });
  });

  test("a room's fields merge one by one, and a later reset drops what came before it", () => {
    const merged = mergeSnapshot(
      {
        ...empty,
        rooms: {
          a: {
            name: { value: "Old", at: 10 },
            cells: { value: { column: 0, row: 0, columns: 2, rows: 2 }, at: 30 },
          },
        },
      },
      { ...empty, rooms: { a: { name: { value: "New", at: 20 } } }, resetAt: 15 }
    );
    expect(merged.resetAt).toBe(15);
    expect(merged.rooms["a"]).toEqual({
      name: { value: "New", at: 20 },
      cells: { value: { column: 0, row: 0, columns: 2, rows: 2 }, at: 30 },
    });
    const wiped = mergeSnapshot(
      { ...empty, placed: { w: { value: { x: 1, y: 1 }, at: 10 } } },
      { ...empty, resetAt: 50 }
    );
    expect(wiped.placed).toEqual({});
  });

  test("threads join by id, a shared one takes every comment of both, the later edit and the later word on resolved", () => {
    const mine: Snapshot = {
      ...empty,
      threads: [
        thread("t1", "first", 1, {
          comments: [
            { id: "t1-1", author: "a", text: "first", createdAt: 1 },
            { id: "t1-2", author: "a", text: "mine", createdAt: 3, editedAt: 3 },
          ],
          resolved: true,
          resolvedAt: 5,
        }),
        thread("t2", "only mine", 2),
      ],
    };
    const theirs: Snapshot = {
      ...empty,
      threads: [
        thread("t1", "first", 1, {
          comments: [
            { id: "t1-1", author: "a", text: "first", createdAt: 1 },
            { id: "t1-2", author: "a", text: "theirs, later", createdAt: 3, editedAt: 4 },
            { id: "t1-3", author: "b", text: "reply", createdAt: 2 },
          ],
          resolved: false,
          resolvedAt: 6,
        }),
        thread("t3", "only theirs", 4),
      ],
    };
    const merged = mergeSnapshot(mine, theirs);
    expect(merged.threads.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
    const t1 = merged.threads[0]!;
    expect(t1.comments.map((c) => c.text)).toEqual(["first", "reply", "theirs, later"]);
    expect(t1.resolved).toBe(false);
    expect(t1.resolvedAt).toBe(6);
  });

  test("merging is the same from either side, and a snapshot is only the persisted fields", () => {
    const a: Snapshot = { ...empty, doorways: { "x>y": { value: null, at: 3 } }, resetAt: 1 };
    const b: Snapshot = {
      ...empty,
      doorways: { "x>y": { value: { col: 1, row: 0, side: "east" }, at: 2 } },
    };
    expect(mergeSnapshot(a, b)).toEqual(mergeSnapshot(b, a));
    expect(snapshotOf({ ...a, mode: "edit" } as Snapshot & { mode: string })).toEqual(a);
  });
});
