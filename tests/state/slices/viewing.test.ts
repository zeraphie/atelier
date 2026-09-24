import { describe, expect, test } from "bun:test";
import { galleryStore } from "../../fixtures.js";

describe("the viewing slice", () => {
  test("entering a viewing names it and starts with no peers", () => {
    const { state } = galleryStore();
    state().peerJoined("z");
    state().enteredViewing("r1");
    expect(state().viewingCode).toBe("r1");
    expect(state().peers).toEqual({});
  });

  test("a peer joining is kept once, named when it says hello, and gone when it leaves", () => {
    const { state } = galleryStore();
    state().peerJoined("a");
    state().peerJoined("b");
    state().peerJoined("a");
    expect(state().peers).toEqual({ a: { name: "" }, b: { name: "" } });
    state().peerNamed("a", "Ren", "u1", "pink");
    state().peerNamed("c", "Kit", "u2", "teal");
    expect(state().peers["a"]).toEqual({ name: "Ren", user: "u1", color: "pink" });
    expect(state().peers["c"]?.name).toBe("Kit");
    state().peerLeft("a");
    expect(Object.keys(state().peers)).toEqual(["b", "c"]);
  });

  test("leaving forgets the viewing and its peers", () => {
    const { state } = galleryStore();
    state().enteredViewing("r1");
    state().peerJoined("a");
    state().leftViewing();
    expect(state().viewingCode).toBeUndefined();
    expect(state().peers).toEqual({});
  });

  test("following a peer is one at a time, and stopping clears it", () => {
    const { state } = galleryStore();
    state().peerJoined("a");
    state().peerJoined("b");
    state().follow("a");
    expect(state().following).toBe("a");
    state().follow("b");
    expect(state().following).toBe("b");
    state().unfollow();
    expect(state().following).toBeUndefined();
  });

  test("followers are kept once each, added when they say so and let go when they stop", () => {
    const { state } = galleryStore();
    state().followedBy("a", true);
    state().followedBy("a", true);
    state().followedBy("b", true);
    expect(state().followers).toEqual(["a", "b"]);
    state().followedBy("a", false);
    expect(state().followers).toEqual(["b"]);
  });

  test("a peer leaving is followed no more and follows no more", () => {
    const { state } = galleryStore();
    state().peerJoined("a");
    state().peerJoined("b");
    state().follow("a");
    state().followedBy("b", true);
    state().peerLeft("a");
    expect(state().following).toBeUndefined();
    expect(state().followers).toEqual(["b"]);
    state().peerLeft("b");
    expect(state().followers).toEqual([]);
  });

  test("leaving the viewing forgets whom you followed and who followed you", () => {
    const { state } = galleryStore();
    state().follow("c");
    state().followedBy("d", true);
    state().leftViewing();
    expect(state().following).toBeUndefined();
    expect(state().followers).toEqual([]);
  });
});
