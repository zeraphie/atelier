import { describe, expect, test } from "bun:test";
import { isDeclined, isUnanimous, tallyOf } from "../../../src/state/slices/viewing.js";
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

describe("a proposal to put everything back", () => {
  test("proposing opens it as this screen's, agreed to already; a second while it is open is nothing", () => {
    const { state } = galleryStore();
    state().propose("p1", 5);
    expect(state().proposal).toEqual({ id: "p1", by: undefined, at: 5, answers: {}, mine: true });
    state().propose("p2", 6);
    expect(state().proposal?.id).toBe("p1");
  });

  test("a peer's proposal opens it as theirs, with them agreed; one from before the reset is nothing", () => {
    const { state } = galleryStore();
    state().reset({ at: 10 });
    state().proposedBy("a", "p0", 10);
    expect(state().proposal).toBeUndefined();
    state().proposedBy("a", "p1", 11);
    expect(state().proposal).toEqual({
      id: "p1",
      by: "a",
      at: 11,
      answers: { a: true },
      mine: undefined,
    });
  });

  test("two proposals made at once: every screen keeps the earlier, by time then by id", () => {
    const { state } = galleryStore();
    state().propose("p2", 6);
    state().proposedBy("a", "p1", 5);
    expect(state().proposal?.by).toBe("a");
    state().proposedBy("b", "p3", 7);
    expect(state().proposal?.id).toBe("p1");
    state().proposedBy("b", "p0", 5);
    expect(state().proposal?.id).toBe("p0");
    state().proposedBy("a", "p0", 5);
    expect(state().proposal?.by).toBe("b");
  });

  test("answers are kept by peer, and only to the proposal that is open", () => {
    const { state } = galleryStore();
    state().answeredBy("a", "p1", true);
    state().answerProposal(true);
    expect(state().proposal).toBeUndefined();
    state().proposedBy("a", "p1", 5);
    state().answeredBy("b", "p1", true);
    state().answeredBy("c", "p9", true);
    state().answerProposal(false);
    expect(state().proposal?.answers).toEqual({ a: true, b: true });
    expect(state().proposal?.mine).toBe(false);
    state().answeredBy("b", "p1", false);
    expect(state().proposal?.answers["b"]).toBe(false);
  });

  test("the tally counts who is here: unanimous once everyone agreed, declined once anyone did", () => {
    const { state } = galleryStore();
    expect(tallyOf(state())).toEqual({ counted: 0, agreed: 0, declined: 0 });
    expect(isUnanimous(tallyOf(state()))).toBe(false);
    state().peerJoined("a");
    state().peerJoined("b");
    state().propose("p1", 5);
    expect(tallyOf(state())).toEqual({ counted: 3, agreed: 1, declined: 0 });
    state().answeredBy("a", "p1", true);
    expect(isUnanimous(tallyOf(state()))).toBe(false);
    state().answeredBy("b", "p1", true);
    expect(tallyOf(state())).toEqual({ counted: 3, agreed: 3, declined: 0 });
    expect(isUnanimous(tallyOf(state()))).toBe(true);
    expect(isDeclined(tallyOf(state()))).toBe(false);
    state().answeredBy("b", "p1", false);
    expect(tallyOf(state())).toEqual({ counted: 3, agreed: 2, declined: 1 });
    expect(isUnanimous(tallyOf(state()))).toBe(false);
    expect(isDeclined(tallyOf(state()))).toBe(true);
  });

  test("who counts is live: an answer counts once its peer is here, and an arrival is one more to ask", () => {
    const { state } = galleryStore();
    state().proposedBy("a", "p1", 5);
    expect(tallyOf(state())).toEqual({ counted: 1, agreed: 0, declined: 0 });
    state().peerJoined("a");
    expect(tallyOf(state())).toEqual({ counted: 2, agreed: 1, declined: 0 });
    state().answerProposal(true);
    expect(isUnanimous(tallyOf(state()))).toBe(true);
    state().peerJoined("b");
    expect(tallyOf(state())).toEqual({ counted: 3, agreed: 2, declined: 0 });
    expect(isUnanimous(tallyOf(state()))).toBe(false);
  });

  test("a leaver's answer stands: a decline still declines, an agreement counts no more; the proposer leaving takes the proposal", () => {
    const { state } = galleryStore();
    state().peerJoined("a");
    state().peerJoined("b");
    state().peerJoined("c");
    state().propose("p1", 5);
    state().answeredBy("a", "p1", true);
    state().answeredBy("b", "p1", false);
    state().peerLeft("a");
    expect(tallyOf(state())).toEqual({ counted: 3, agreed: 1, declined: 1 });
    state().peerLeft("b");
    expect(state().proposal?.answers).toEqual({ a: true, b: false });
    expect(tallyOf(state())).toEqual({ counted: 2, agreed: 1, declined: 1 });
    expect(isDeclined(tallyOf(state()))).toBe(true);
    state().answeredBy("c", "p1", true);
    expect(isUnanimous(tallyOf(state()))).toBe(false);
    const other = galleryStore();
    other.state().peerJoined("a");
    other.state().proposedBy("a", "p1", 5);
    other.state().answerProposal(true);
    other.state().peerLeft("a");
    expect(other.state().proposal).toBeUndefined();
  });

  test("withdrawing is the proposer's: this screen withdraws its own, and a peer only theirs", () => {
    const { state } = galleryStore();
    state().proposedBy("a", "p1", 5);
    state().withdrawProposal();
    state().withdrawnBy("b", "p1");
    state().withdrawnBy("a", "p2");
    expect(state().proposal?.id).toBe("p1");
    state().withdrawnBy("a", "p1");
    expect(state().proposal).toBeUndefined();
    state().propose("p2", 6);
    state().withdrawnBy("a", "p2");
    expect(state().proposal?.id).toBe("p2");
    state().withdrawProposal();
    expect(state().proposal).toBeUndefined();
  });

  test("closing forgets the proposal here, as does entering or leaving a viewing", () => {
    const { state } = galleryStore();
    state().propose("p1", 5);
    state().closeProposal();
    expect(state().proposal).toBeUndefined();
    state().propose("p2", 6);
    state().enteredViewing("r1");
    expect(state().proposal).toBeUndefined();
    state().propose("p3", 7);
    state().leftViewing();
    expect(state().proposal).toBeUndefined();
  });
});
