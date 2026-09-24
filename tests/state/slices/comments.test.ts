import { describe, expect, test } from "bun:test";
import { galleryStore } from "../../fixtures.js";

describe("the comments slice", () => {
  test("opening a thread pins it here, open, with its first comment as this person", () => {
    const { state, told } = galleryStore();
    const id = state().openThread({ x: 120, y: 80 }, "Look at the rain");
    const thread = state().threads[0]!;
    expect(thread.id).toBe(id);
    expect(thread.at).toEqual({ x: 120, y: 80 });
    expect(thread.resolved).toBe(false);
    expect(thread.comments[0]?.author).toBe("Izzy");
    expect(told.map((call) => call.action)).toEqual(["putThread"]);
  });

  test("a reply goes on the end of its thread", () => {
    const { state } = galleryStore();
    const id = state().openThread({ x: 0, y: 0 }, "First");
    state().reply(id, "Second");
    expect(state().threads[0]!.comments.map((c) => c.text)).toEqual(["First", "Second"]);
  });

  test("the same comment put again changes nothing", () => {
    const { state } = galleryStore();
    const id = state().openThread({ x: 0, y: 0 }, "First");
    state().reply(id, "Second");
    const reply = state().threads[0]!.comments[1]!;
    state().putComment(id, reply);
    expect(state().threads[0]!.comments.map((c) => c.text)).toEqual(["First", "Second"]);
  });

  test("an edit changes the text and marks when; a later one stands, an earlier one does not", () => {
    const { state } = galleryStore();
    const id = state().openThread({ x: 0, y: 0 }, "First");
    const commentId = state().threads[0]!.comments[0]!.id;
    state().setText(id, commentId, "Later", 200);
    state().setText(id, commentId, "Earlier", 100);
    expect(state().threads[0]!.comments[0]).toMatchObject({ text: "Later", editedAt: 200 });
  });

  test("resolving and reopening flip the thread's state", () => {
    const { state } = galleryStore();
    const id = state().openThread({ x: 0, y: 0 }, "First");
    state().resolve(id, true);
    expect(state().threads[0]!.resolved).toBe(true);
    state().resolve(id, false);
    expect(state().threads[0]!.resolved).toBe(false);
  });

  test("a record from a peer is applied and not told back", () => {
    const { state, told } = galleryStore();
    state().putThread(
      { id: "t9", at: { x: 1, y: 2 }, comments: [], resolved: false },
      { at: 5, remote: true }
    );
    expect(state().threads.map((t) => t.id)).toEqual(["t9"]);
    expect(told).toHaveLength(0);
  });

  test("a draft closes the open thread and leaves whatever mode is on", () => {
    const { state } = galleryStore();
    state().setMode("comment");
    state().showThread("t1");
    state().startDraft({ x: 3, y: 4 });
    expect(state().draftAt).toEqual({ x: 3, y: 4 });
    expect(state().openThreadId).toBeUndefined();
    expect(state().mode).toBe("browse");
  });
});
