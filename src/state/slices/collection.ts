/**
 * ─ Collection slice ─
 *
 * Your own pictures, kept once whatever room is open: the record of
 * each, its credits in your words, its size and its colour. The bytes
 * are in the database's picture store under the same id, the hash of
 * the file, so the same file from two people is stored once, while
 * each keeps their own record. A hanging in a room points here by id.
 * Decision: DECISIONS.md, a picture and its hanging are two things.
 */

import type { Get, Set } from "../utils/actions.js";
import type { OwnStore } from "../own-store.js";

export interface PictureRecord {
  /** The SHA-256 of the file's bytes, as hex. */
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly year: string;
  readonly credit: string;
  readonly description: string;
  readonly widthCm: number;
  readonly heightCm: number;
  /** The picture's dominant colour, for the far tier. */
  readonly color: string;
  /** The derivative's pixels, for the tiers. */
  readonly size: { readonly width: number; readonly height: number };
  /** Whose it is when it came from a peer; absent for your own. */
  readonly from?: string;
}

export interface CollectionSlice {
  readonly pictures: Readonly<Record<string, PictureRecord>>;
  addPicture(record: PictureRecord): void;
  removePicture(id: string): void;
}

export function createCollectionSlice(set: Set<OwnStore>, _get: Get<OwnStore>): CollectionSlice {
  return {
    pictures: {},
    addPicture: (record) => {
      set((state) => ({ pictures: { ...state.pictures, [record.id]: record } }));
    },
    removePicture: (id) => {
      set((state) => {
        const { [id]: _gone, ...pictures } = state.pictures;
        return { pictures };
      });
    },
  };
}
