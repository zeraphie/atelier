/**
 * ─ Fixtures ─
 *
 * What two test files share: the gallery store stood up on its own,
 * with a fixed name and every action told into a list, and the plain
 * rooms, works and threads the layout tests build from. A test file
 * keeps a fixture of its own only while it is the one file that needs it.
 */

import { createStore } from "zustand/vanilla";
import { createCommentsSlice } from "../src/state/slices/comments.js";
import { createGallerySlice } from "../src/state/slices/gallery.js";
import { createInterfaceSlice } from "../src/state/slices/interface.js";
import { createPicturesSlice } from "../src/state/slices/pictures.js";
import { createViewingSlice } from "../src/state/slices/viewing.js";
import type { ActionCall } from "../src/state/utils/actions.js";
import type { Store } from "../src/state/store.js";

/** The gallery store as the tests stand it up: every slice on a plain store, acting as Izzy in teal, every action told into `told`. */
export function galleryStore() {
  const told: ActionCall[] = [];
  const context = {
    who: () => "Izzy",
    color: () => "teal",
    tell: (call: ActionCall) => {
      told.push(call);
    },
  };
  const store = createStore<Store>()((set, get) => ({
    ...createCommentsSlice(context)(set, get),
    ...createPicturesSlice(context)(set, get),
    ...createGallerySlice(context)(set, get),
    ...createInterfaceSlice(set, get),
    ...createViewingSlice(set, get),
  }));
  return { store, told, state: () => store.getState() };
}
