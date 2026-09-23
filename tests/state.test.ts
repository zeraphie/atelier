import { describe, expect, test } from "bun:test";
import { createStore } from "zustand/vanilla";
import { createCommentsSlice } from "../src/state/slices/comments.js";
import { createGallerySlice } from "../src/state/slices/gallery.js";
import { createPicturesSlice } from "../src/state/slices/pictures.js";
import type { ActionCall } from "../src/state/utils/actions.js";
import type { Store } from "../src/state/store.js";

// The gallery store as the tests stand it up: the three slices on a plain
// store, a fixed name, and every action told into a list.
function gallery() {
  const told: ActionCall[] = [];
  const context = {
    who: () => "Izzy",
    tell: (call: ActionCall) => {
      told.push(call);
    },
  };
  const store = createStore<Store>()((set, get) => ({
    ...createCommentsSlice(context)(set, get),
    ...createPicturesSlice(context)(set, get),
    ...createGallerySlice(context)(set, get),
  }));
  return { store, told, state: () => store.getState() };
}

describe("comments", () => {
  test("opening a thread pins it here, open, with its first comment as this person", () => {
    const { state, told } = gallery();
    const id = state().openThread({ x: 120, y: 80 }, "Look at the rain");
    const thread = state().threads[0]!;
    expect(thread.id).toBe(id);
    expect(thread.at).toEqual({ x: 120, y: 80 });
    expect(thread.resolved).toBe(false);
    expect(thread.comments[0]?.author).toBe("Izzy");
    expect(told.map((call) => call.action)).toEqual(["putThread"]);
  });

  test("a reply goes on the end of its thread; the same record again changes nothing", () => {
    const { state } = gallery();
    const id = state().openThread({ x: 0, y: 0 }, "First");
    state().reply(id, "Second");
    const reply = state().threads[0]!.comments[1]!;
    state().putComment(id, reply);
    expect(state().threads[0]!.comments.map((c) => c.text)).toEqual(["First", "Second"]);
  });

  test("an edit changes the text and marks when; a later one stands, an earlier one does not", () => {
    const { state } = gallery();
    const id = state().openThread({ x: 0, y: 0 }, "First");
    const commentId = state().threads[0]!.comments[0]!.id;
    state().setText(id, commentId, "Later", 200);
    state().setText(id, commentId, "Earlier", 100);
    expect(state().threads[0]!.comments[0]).toMatchObject({ text: "Later", editedAt: 200 });
  });

  test("resolving and reopening flip the thread's state", () => {
    const { state } = gallery();
    const id = state().openThread({ x: 0, y: 0 }, "First");
    state().resolve(id, true);
    expect(state().threads[0]!.resolved).toBe(true);
    state().resolve(id, false);
    expect(state().threads[0]!.resolved).toBe(false);
  });

  test("a record from a peer is applied and not told back", () => {
    const { state, told } = gallery();
    state().putThread(
      { id: "t9", at: { x: 1, y: 2 }, comments: [], resolved: false },
      { at: 5, remote: true }
    );
    expect(state().threads.map((t) => t.id)).toEqual(["t9"]);
    expect(told).toHaveLength(0);
  });

  test("a draft closes the open thread and leaves whatever mode is on", () => {
    const { state } = gallery();
    state().setMode("comment");
    state().showThread("t1");
    state().startDraft({ x: 3, y: 4 });
    expect(state().draftAt).toEqual({ x: 3, y: 4 });
    expect(state().openThreadId).toBeUndefined();
    expect(state().mode).toBe("browse");
  });
});

describe("pictures", () => {
  test("moving a work keeps the later move, whichever order they arrive", () => {
    const { state } = gallery();
    state().moveWork("w", { x: 10, y: 10 }, { at: 200 });
    state().moveWork("w", { x: 5, y: 5 }, { at: 100 });
    expect(state().placed["w"]?.value).toEqual({ x: 10, y: 10 });
  });

  test("a reset is a floor: a move from before it changes nothing, one after it does", () => {
    const { state } = gallery();
    state().moveWork("w", { x: 10, y: 10 }, { at: 100 });
    state().reset({ at: 150 });
    expect(state().placed).toEqual({});
    state().moveWork("w", { x: 1, y: 1 }, { at: 120 });
    expect(state().placed).toEqual({});
    state().moveWork("w", { x: 2, y: 2 }, { at: 160 });
    expect(state().placed["w"]?.value).toEqual({ x: 2, y: 2 });
  });

  test("taking a picture down leaves a tombstone a late hanging cannot lift", () => {
    const { state } = gallery();
    const hanging = { id: "h1", pictureId: "p", at: { x: 0, y: 0 }, widthCm: 60 };
    state().takeDown("h1", { at: 300 });
    state().hang(hanging, { at: 200 });
    expect(state().hangings["h1"]?.value).toBeNull();
  });
});

describe("gallery", () => {
  test("a room keeps its later name, cells and drawing", () => {
    const { state } = gallery();
    state().renameRoom("a", "Old", { at: 100 });
    state().renameRoom("a", "New", { at: 200 });
    state().resizeRoom("a", { column: 0, row: 0, columns: 3, rows: 2 }, { at: 100 });
    state().drawRoom("b", "Annex", { column: 5, row: 0, columns: 2, rows: 2 }, { at: 300 });
    expect(state().rooms["a"]?.name?.value).toBe("New");
    expect(state().rooms["a"]?.cells?.value.columns).toBe(3);
    expect(state().rooms["b"]?.drawn?.at).toBe(300);
  });

  test("a drawn room is taken away by a later removal, not by an earlier one, and the removal is told", () => {
    const { state, told } = gallery();
    state().drawRoom("b", "Annex", { column: 5, row: 0, columns: 2, rows: 2 }, { at: 300 });
    state().removeRoom("b", { at: 200, remote: true });
    expect(state().rooms["b"]?.drawn?.value).toBe(true);
    state().removeRoom("b", { at: 400 });
    expect(state().rooms["b"]?.drawn?.value).toBe(false);
    expect(told.at(-1)).toEqual({ action: "removeRoom", args: ["b"], at: 400 });
  });

  test("a reset forgets every edit and placement from before it, and is told once", () => {
    const { state, told } = gallery();
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
    const { state, told } = gallery();
    state().renameRoom("a", "Hall", { at: 100 });
    state().renameRoom("a", "Foyer", { at: 200, remote: true });
    expect(told).toEqual([{ action: "renameRoom", args: ["a", "Hall"], at: 100 }]);
    expect(state().rooms["a"]?.name?.value).toBe("Foyer");
  });
});

describe("selection", () => {
  const cells = { column: 5, row: 0, columns: 2, rows: 2 };

  test("a pick toggles, a change of mode lets every pick go, and a removal removes each picked room", () => {
    const { state, told } = gallery();
    state().drawRoom("b", "Annex", cells, { at: 100 });
    state().drawRoom("c", "Wing", { ...cells, column: 7 }, { at: 100 });
    state().setMode("edit");
    state().toggleSelected("b");
    state().toggleSelected("c");
    state().toggleSelected("b");
    expect(state().selected).toEqual(["c"]);
    state().setMode("browse");
    expect(state().selected).toEqual([]);
    state().setMode("edit");
    state().toggleSelected("b");
    state().toggleSelected("c");
    state().removeSelected({ at: 200 });
    expect(state().selected).toEqual([]);
    expect(state().rooms["b"]?.drawn?.value).toBe(false);
    expect(state().rooms["c"]?.drawn?.value).toBe(false);
    expect(told.filter((call) => call.action === "removeRoom")).toHaveLength(2);
  });
});
