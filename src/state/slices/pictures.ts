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
import { acting, type Get, type Set, type SliceContext } from "../utils/actions.js";
import { keptAfter, latestIn, type Stamped, type When } from "../utils/stamped.js";
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
  (set: Set<Store>, get: Get<Store>): PicturesSlice => {
    const act = acting(get, context);
    return {
      placed: {},
      hangings: {},

      moveWork: (id, to, when) =>
        act(when, { action: "moveWork", args: [id, to] }, (at) =>
          set((state) => ({ placed: latestIn(state.placed, id, to, at) }))
        ),
      hang: (hanging, when) =>
        act(when, { action: "hang", args: [hanging] }, (at) =>
          set((state) => ({ hangings: latestIn(state.hangings, hanging.id, hanging, at) }))
        ),
      takeDown: (id, when) =>
        act(when, { action: "takeDown", args: [id] }, (at) =>
          set((state) => ({ hangings: latestIn(state.hangings, id, null, at) }))
        ),
      clearPictures: (at) => {
        set((state) => ({
          placed: keptAfter(state.placed, at),
          hangings: keptAfter(state.hangings, at),
        }));
      },
    };
  };
