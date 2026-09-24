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
import type { Thread } from "../src/comments/model.js";
import type { Spacing } from "../src/gallery/layout/hang.js";
import type { Cells, Room, Work } from "../src/gallery/works.js";

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

/** The spacing the layout tests hang with: a metre grid, small gaps, thin walls, a door a fifth of a cell. */
export const SPACING: Spacing = {
  unitCm: 100,
  gapCm: 10,
  standoffCm: 5,
  endMarginCm: 20,
  headroomCm: 10,
  wallCm: 4,
  doorCm: 20,
};

/** A room on the grid by its cells, named as its id, with its works. */
export function room(
  id: string,
  column: number,
  row: number,
  columns: number,
  rows: number,
  works: Work[] = []
): Room {
  return { id, name: id, column, row, columns, rows, works };
}

/** A room from a cells record, for tests that keep their cells to hand. */
export function roomOf(id: string, cells: Cells, works: Work[] = []): Room {
  return room(id, cells.column, cells.row, cells.columns, cells.rows, works);
}

/** A work of a size, titled as its id, the rest blank; with a wall if it names one, and a picture if it is one of your own. */
export function work(
  id: string,
  widthCm: number,
  heightCm: number,
  extra: Partial<Pick<Work, "wall" | "pictureId">> = {}
): Work {
  return {
    id,
    title: id,
    artist: "",
    year: "",
    medium: "",
    widthCm,
    heightCm,
    collection: "",
    source: "",
    ...extra,
  };
}

/** A thread with one comment by "a": at the origin, open, its text its id, unless `extra` says otherwise. */
export function thread(
  id: string,
  extra: Partial<Thread> & { readonly text?: string; readonly createdAt?: number } = {}
): Thread {
  const { text = id, createdAt = 0, ...rest } = extra;
  return {
    id,
    at: { x: 0, y: 0 },
    resolved: false,
    comments: [{ id: `${id}-1`, author: "a", text, createdAt }],
    ...rest,
  };
}
