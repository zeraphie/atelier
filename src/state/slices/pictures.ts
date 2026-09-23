/**
 * ─ Pictures slice ─
 *
 * Where the pictures are, as far as this gallery has moved them: a
 * placed point for any work dragged off where the hang put it, and
 * the hangings of your own pictures, each a picture from the collection
 * and a place. Latest wins by stamp; a hanging taken down leaves a
 * tombstone so a late replay cannot put it back; a reset is a floor.
 * Decision: DECISIONS.md, the wall is curated by default, yours to rearrange here.
 */

import type { Point } from "../../geometry.js";
import type { Get, Set, SliceContext } from "../utils/actions.js";
import { keptAfter, latest, stamp, type Stamped, type When } from "../utils/stamped.js";
import type { Store } from "../store.js";

export interface Hanging {
  readonly id: string;
  /** Who hung it, by their browser's id; absent for one hung before ids, which anyone may handle. */
  readonly by?: string;
  /** The picture in the collection, by the hash of its bytes. */
  readonly pictureId: string;
  /** Where it hangs, the picture's centre, in world units. */
  readonly at: Point;
  readonly widthCm: number;
}

export interface PicturesSlice {
  /** Works moved from where the hang put them, by work id, gallery works and hangings alike. */
  readonly placed: Readonly<Record<string, Stamped<Point>>>;
  /** Your own pictures hung here, by hanging id; null once taken down. */
  readonly hangings: Readonly<Record<string, Stamped<Hanging | null>>>;
  moveWork(id: string, to: Point, when?: When): void;
  hang(hanging: Hanging, when?: When): void;
  takeDown(id: string, when?: When): void;
  /** Forget every placement and hanging from before `at`: the reset's half. */
  clearPictures(at: number): void;
}

export const createPicturesSlice =
  (context: SliceContext) =>
  (set: Set<Store>, get: Get<Store>): PicturesSlice => ({
    placed: {},
    hangings: {},

    moveWork: (id, to, when) => {
      const { at, remote } = stamp(when);
      if (at <= get().resetAt) {
        return;
      }
      set((state) => ({
        placed: { ...state.placed, [id]: latest(state.placed[id], { value: to, at }) },
      }));
      if (!remote) {
        context.tell({ action: "moveWork", args: [id, to], at });
      }
    },
    hang: (hanging, when) => {
      const { at, remote } = stamp(when);
      if (at <= get().resetAt) {
        return;
      }
      set((state) => ({
        hangings: {
          ...state.hangings,
          [hanging.id]: latest(state.hangings[hanging.id], { value: hanging, at }),
        },
      }));
      if (!remote) {
        context.tell({ action: "hang", args: [hanging], at });
      }
    },
    takeDown: (id, when) => {
      const { at, remote } = stamp(when);
      if (at <= get().resetAt) {
        return;
      }
      set((state) => ({
        hangings: { ...state.hangings, [id]: latest(state.hangings[id], { value: null, at }) },
      }));
      if (!remote) {
        context.tell({ action: "takeDown", args: [id], at });
      }
    },
    clearPictures: (at) => {
      set((state) => ({
        placed: keptAfter(state.placed, at),
        hangings: keptAfter(state.hangings, at),
      }));
    },
  });
