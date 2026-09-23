/**
 * ─ The gallery store ─
 *
 * One store for what a gallery is made of, composed from three slices:
 * the comments, the pictures and the gallery itself. What persists is
 * the records, threads, placements, hangings, rooms, doorways and the
 * reset floor; what the interface is doing right now does not. It
 * persists under one key per room in the database, the solo gallery
 * under its own, and joins the roll call the curtain waits on.
 * Decision: DECISIONS.md, state: zustand slices.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createCommentsSlice, type CommentsSlice } from "../comments/slice.js";
import { createGallerySlice, type GallerySlice } from "../gallery/gallery-slice.js";
import { createPicturesSlice, type PicturesSlice } from "../gallery/pictures-slice.js";
import { hydration, stateStorage } from "../storage/index.js";
import { tell, type SliceContext } from "./actions.js";
import { useOwnStore } from "./own-store.js";

export type Store = CommentsSlice & PicturesSlice & GallerySlice;

/** The solo gallery's key; a room's is this with the room's id after a dot. */
export const GALLERY_KEY = "atelier.gallery";

const context: SliceContext = { who: () => useOwnStore.getState().name, tell };

hydration.expect("gallery");

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createCommentsSlice(context)(set, get),
      ...createPicturesSlice(context)(set, get),
      ...createGallerySlice(context)(set, get),
    }),
    {
      name: GALLERY_KEY,
      version: 1,
      storage: createJSONStorage(() => stateStorage),
      partialize: (state) => ({
        threads: state.threads,
        placed: state.placed,
        hangings: state.hangings,
        rooms: state.rooms,
        doorways: state.doorways,
        resetAt: state.resetAt,
      }),
      // Loaded, or failed to load and carrying on empty: either way the curtain may open.
      onRehydrateStorage: () => (_state, error) => {
        if (error !== undefined) {
          reportError(error);
        }
        hydration.loaded("gallery");
      },
    }
  )
);
