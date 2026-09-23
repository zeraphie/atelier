/**
 * ─ The gallery store ─
 *
 * One store for what a gallery is made of, composed from four slices:
 * the comments, the pictures, the gallery itself, and the room it is
 * shared in. What persists is
 * the records, threads, placements, hangings, rooms, doorways and the
 * reset floor; what the interface is doing right now does not. It
 * persists under one key per room in the database, the solo gallery
 * under its own, and joins the roll call the curtain waits on.
 * Decision: DECISIONS.md, state: zustand slices.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createCommentsSlice, type CommentsSlice } from "./slices/comments.js";
import { createGallerySlice, type GallerySlice } from "./slices/gallery.js";
import { createPicturesSlice, type PicturesSlice } from "./slices/pictures.js";
import { createRoomSlice, type RoomSlice } from "./slices/room.js";
import { hydration, stateStorage } from "../storage/index.js";
import { tell, type SliceContext } from "./utils/actions.js";
import { useOwnStore } from "./own-store.js";

export type Store = CommentsSlice & PicturesSlice & GallerySlice & RoomSlice;

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
      ...createRoomSlice(set, get),
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

/** The key a room's gallery persists under. */
export function keyForRoom(roomId: string | undefined): string {
  return roomId === undefined ? GALLERY_KEY : `${GALLERY_KEY}.${roomId}`;
}

// What a gallery holds when nothing has happened in it yet: the persisted
// fields at their start, and nothing open.
const EMPTY: Partial<Store> = {
  threads: [],
  placed: {},
  hangings: {},
  rooms: {},
  doorways: {},
  resetAt: 0,
  openThreadId: undefined,
  draftAt: undefined,
  selected: [],
  naming: undefined,
};

/**
 * Persist the gallery under `key` from now on. A gallery saved under it
 * loads first; one never seen starts empty, so nothing carries over from
 * the gallery before. What the interface is doing stays as it is.
 */
export async function switchGallery(key: string): Promise<void> {
  useStore.persist.setOptions({ name: key });
  const saved = await stateStorage.getItem(key);
  if (saved === null) {
    useStore.setState(EMPTY);
  } else {
    await useStore.persist.rehydrate();
  }
}
