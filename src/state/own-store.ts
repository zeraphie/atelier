/**
 * ─ The own store ─
 *
 * What is this browser's whichever viewing is open: who it is, and
 * its collection of pictures. Two slices, persisted once under one
 * key, apart from the gallery store, which swaps per viewing. Joins the roll
 * call the curtain waits on.
 * Decision: DECISIONS.md, state: zustand slices.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createCollectionSlice, type CollectionSlice } from "./slices/collection.js";
import { hydration, stateStorage } from "../storage/index.js";
import { createUserSlice, type UserSlice } from "./slices/user.js";

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
      partialize: (state) => ({
        userId: state.userId,
        name: state.name,
        color: state.color,
        viewings: state.viewings,
        home: state.home,
        pictures: state.pictures,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error !== undefined) {
          reportError(error);
        }
        hydration.loaded("own");
        // Written back once loaded, so an id made on this load is kept for the next.
        useOwnStore.setState({});
      },
    }
  )
);
