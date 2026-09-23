/**
 * ─ The own store ─
 *
 * What is this browser's whatever room is open: who it is, and its
 * collection of pictures. Two slices, persisted once under one key,
 * apart from the gallery store, which swaps per room. Joins the roll
 * call the curtain waits on.
 * Decision: DECISIONS.md, state: zustand slices.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createCollectionSlice, type CollectionSlice } from "../gallery/collection-slice.js";
import { hydration, stateStorage } from "../storage/index.js";
import { createUserSlice, type UserSlice } from "../user/user-slice.js";

export type OwnStore = UserSlice & CollectionSlice;

hydration.expect("own");

export const useOwnStore = create<OwnStore>()(
  persist(
    (set, get) => ({
      ...createUserSlice(set, get),
      ...createCollectionSlice(set, get),
    }),
    {
      name: "atelier.own",
      version: 1,
      storage: createJSONStorage(() => stateStorage),
      partialize: (state) => ({ name: state.name, rooms: state.rooms, pictures: state.pictures }),
      onRehydrateStorage: () => (_state, error) => {
        if (error !== undefined) {
          reportError(error);
        }
        hydration.loaded("own");
      },
    }
  )
);
