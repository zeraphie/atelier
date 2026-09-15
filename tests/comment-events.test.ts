import { describe, expect, test } from "bun:test";
import { applyEvent, type CommentEvent } from "../src/comments/events.js";
import { EMPTY, type Comment } from "../src/comments/model.js";

function comment(id: string, text: string, createdAt = 1000): Comment {
  return { id, author: "Izzy", text, createdAt };
}

const opened: CommentEvent = {
  type: "opened",
  threadId: "t1",
  at: { x: 120, y: 80 },
  comment: comment("c1", "Look at the rain"),
};

describe("applyEvent", () => {
  test("opening a thread pins it, open, with its first comment", () => {
    const state = applyEvent(EMPTY, opened);
    expect(state.threads).toHaveLength(1);
    expect(state.threads[0]).toEqual({
      id: "t1",
      at: { x: 120, y: 80 },
      comments: [comment("c1", "Look at the rain")],
      resolved: false,
    });
  });

  test("a reply goes on the end of its thread", () => {
    const state = applyEvent(applyEvent(EMPTY, opened), {
      type: "replied",
      threadId: "t1",
      comment: comment("c2", "And the bridge", 2000),
    });
    expect(state.threads[0]!.comments.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  test("an edit changes one comment's text and marks when", () => {
    const state = applyEvent(applyEvent(EMPTY, opened), {
      type: "edited",
      threadId: "t1",
      commentId: "c1",
      text: "Look at the rain, and the bridge",
      at: 3000,
    });
    expect(state.threads[0]!.comments[0]).toEqual({
      ...comment("c1", "Look at the rain, and the bridge"),
      editedAt: 3000,
    });
  });

  test("resolving and reopening flip the thread's state", () => {
    const resolved = applyEvent(applyEvent(EMPTY, opened), {
      type: "resolved",
      threadId: "t1",
      resolved: true,
    });
    expect(resolved.threads[0]!.resolved).toBe(true);
    const reopened = applyEvent(resolved, { type: "resolved", threadId: "t1", resolved: false });
    expect(reopened.threads[0]!.resolved).toBe(false);
  });

  test("an event for a thread that is not there changes nothing", () => {
    const state = applyEvent(EMPTY, opened);
    expect(applyEvent(state, { type: "resolved", threadId: "nope", resolved: true })).toBe(state);
    expect(
      applyEvent(state, { type: "replied", threadId: "nope", comment: comment("c9", "?") })
    ).toBe(state);
  });

  test("an edit for a comment that is not there changes nothing", () => {
    const state = applyEvent(EMPTY, opened);
    expect(
      applyEvent(state, { type: "edited", threadId: "t1", commentId: "nope", text: "?", at: 1 })
    ).toBe(state);
  });

  test("an event applied twice changes nothing the second time", () => {
    const once = applyEvent(EMPTY, opened);
    expect(applyEvent(once, opened)).toBe(once);
    const reply: CommentEvent = {
      type: "replied",
      threadId: "t1",
      comment: comment("c2", "Again"),
    };
    const replied = applyEvent(once, reply);
    expect(applyEvent(replied, reply)).toBe(replied);
    const resolve: CommentEvent = { type: "resolved", threadId: "t1", resolved: true };
    const resolved = applyEvent(replied, resolve);
    expect(applyEvent(resolved, resolve)).toBe(resolved);
    const change: CommentEvent = {
      type: "edited",
      threadId: "t1",
      commentId: "c1",
      text: "New",
      at: 5,
    };
    const edited = applyEvent(resolved, change);
    expect(applyEvent(edited, change)).toBe(edited);
  });

  test("other threads are left as they were", () => {
    const two = applyEvent(applyEvent(EMPTY, opened), {
      ...opened,
      threadId: "t2",
      comment: comment("c3", "Second"),
    });
    const first = two.threads[0];
    const changed = applyEvent(two, { type: "resolved", threadId: "t2", resolved: true });
    expect(changed.threads[0]).toBe(first);
    expect(changed.threads[1]!.resolved).toBe(true);
  });
});
