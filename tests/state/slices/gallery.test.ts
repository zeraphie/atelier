import { describe, expect, test } from "bun:test";
import { galleryStore } from "../../fixtures.js";

describe("the gallery slice", () => {
  test("a room keeps its later name, cells and drawing", () => {
    const { state } = galleryStore();
    state().renameRoom("a", "Old", { at: 100 });
    state().renameRoom("a", "New", { at: 200 });
    state().resizeRoom("a", { column: 0, row: 0, columns: 3, rows: 2 }, { at: 100 });
    state().drawRoom("b", "Annex", { column: 5, row: 0, columns: 2, rows: 2 }, { at: 300 });
    expect(state().rooms["a"]?.name?.value).toBe("New");
    expect(state().rooms["a"]?.cells?.value.columns).toBe(3);
    expect(state().rooms["b"]?.drawn?.at).toBe(300);
  });

  test("a drawn room is taken away by a later removal, not by an earlier one, and the removal is told", () => {
    const { state, told } = galleryStore();
    state().drawRoom("b", "Annex", { column: 5, row: 0, columns: 2, rows: 2 }, { at: 300 });
    state().removeRoom("b", { at: 200, remote: true });
    expect(state().rooms["b"]?.drawn?.value).toBe(true);
    state().removeRoom("b", { at: 400 });
    expect(state().rooms["b"]?.drawn?.value).toBe(false);
    expect(told.at(-1)).toEqual({ action: "removeRoom", args: ["b"], at: 400 });
  });

  test("a doorway taken away is null, the later stamp winning, and the removal is told", () => {
    const { state, told } = galleryStore();
    state().moveDoor("a>b", { col: 1, row: 0, side: "east" }, { at: 100 });
    state().removeDoor("a>b", { at: 50, remote: true });
    expect(state().doorways["a>b"]?.value).toEqual({ col: 1, row: 0, side: "east" });
    state().removeDoor("a>b", { at: 200 });
    expect(state().doorways["a>b"]?.value).toBeNull();
    expect(told.at(-1)).toEqual({ action: "removeDoor", args: ["a>b"], at: 200 });
  });

  test("a reset forgets every edit and placement from before it, and is told once", () => {
    const { state, told } = galleryStore();
    state().renameRoom("a", "Old", { at: 100 });
    state().moveDoor("a>b", { col: 1, row: 0, side: "east" }, { at: 100 });
    state().moveWork("w", { x: 1, y: 1 }, { at: 100 });
    state().reset({ at: 150 });
    expect(state().rooms).toEqual({});
    expect(state().doorways).toEqual({});
    expect(state().placed).toEqual({});
    expect(state().resetAt).toBe(150);
    expect(told.filter((call) => call.action === "reset")).toHaveLength(1);
  });

  test("every local action is told by name with its time; a peer's is not", () => {
    const { state, told } = galleryStore();
    state().renameRoom("a", "Hall", { at: 100 });
    state().renameRoom("a", "Foyer", { at: 200, remote: true });
    expect(told).toEqual([{ action: "renameRoom", args: ["a", "Hall"], at: 100 }]);
    expect(state().rooms["a"]?.name?.value).toBe("Foyer");
  });
});
