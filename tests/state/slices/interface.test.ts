import { describe, expect, test } from "bun:test";
import { galleryStore } from "../../fixtures.js";

const cells = { column: 5, row: 0, columns: 2, rows: 2 };

describe("the interface slice", () => {
  test("a pick alone replaces the picks, and a pick beside toggles one", () => {
    const { state } = galleryStore();
    state().setMode("edit");
    state().holdTool("room");
    state().selectOnly("a");
    state().toggleSelected("b");
    state().toggleSelected("c");
    state().toggleSelected("b");
    expect(state().selected).toEqual(["a", "c"]);
    state().selectOnly("b");
    expect(state().selected).toEqual(["b"]);
  });

  test("a change of mode or of tool lets every pick go", () => {
    const { state } = galleryStore();
    state().setMode("edit");
    state().holdTool("room");
    state().selectOnly("b");
    state().holdTool("move");
    expect(state().selected).toEqual([]);
    state().holdTool("room");
    state().selectOnly("b");
    state().setMode("browse");
    expect(state().selected).toEqual([]);
  });

  test("a removal removes the drawn rooms picked, leaves a shipped one, and lets the selection go", () => {
    const { state, told } = galleryStore();
    state().drawRoom("b", "Annex", cells, { at: 100 });
    state().drawRoom("c", "Wing", { ...cells, column: 7 }, { at: 100 });
    state().setMode("edit");
    state().holdTool("room");
    state().selectOnly("a");
    state().toggleSelected("b");
    state().toggleSelected("c");
    state().removeSelected({ at: 200 });
    expect(state().selected).toEqual([]);
    expect(state().rooms["a"]).toBeUndefined();
    expect(state().rooms["b"]?.drawn?.value).toBe(false);
    expect(state().rooms["c"]?.drawn?.value).toBe(false);
    expect(told.filter((call) => call.action === "removeRoom")).toHaveLength(2);
  });

  test("asking for a name or a picture is kept until asked no more", () => {
    const { state } = galleryStore();
    state().askName("b");
    expect(state().naming).toBe("b");
    state().askName(undefined);
    expect(state().naming).toBeUndefined();
    state().askPicture({ x: 1, y: 2 });
    expect(state().hangingAt).toEqual({ x: 1, y: 2 });
    state().askPicture(undefined);
    expect(state().hangingAt).toBeUndefined();
  });
});
