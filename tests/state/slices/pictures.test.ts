import { describe, expect, test } from "bun:test";
import { galleryStore } from "../../fixtures.js";

describe("the pictures slice", () => {
  test("moving a work keeps the later move, whichever order they arrive", () => {
    const { state } = galleryStore();
    state().moveWork("w", { x: 10, y: 10 }, { at: 200 });
    state().moveWork("w", { x: 5, y: 5 }, { at: 100 });
    expect(state().placed["w"]?.value).toEqual({ x: 10, y: 10 });
  });

  test("a reset is a floor: a move from before it changes nothing, one after it does", () => {
    const { state } = galleryStore();
    state().moveWork("w", { x: 10, y: 10 }, { at: 100 });
    state().reset({ at: 150 });
    expect(state().placed).toEqual({});
    state().moveWork("w", { x: 1, y: 1 }, { at: 120 });
    expect(state().placed).toEqual({});
    state().moveWork("w", { x: 2, y: 2 }, { at: 160 });
    expect(state().placed["w"]?.value).toEqual({ x: 2, y: 2 });
  });

  test("taking a picture down leaves a tombstone a late hanging cannot lift", () => {
    const { state } = galleryStore();
    const hanging = { id: "h1", pictureId: "p", at: { x: 0, y: 0 }, widthCm: 60 };
    state().takeDown("h1", { at: 300 });
    state().hang(hanging, { at: 200 });
    expect(state().hangings["h1"]?.value).toBeNull();
  });
});
