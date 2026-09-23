/**
 * ─ Gallery slice ─
 *
 * The rooms and doorways as this gallery has changed them, and what
 * the interface is doing: the mode, and the tool held in edit mode.
 * A room keeps a renamed name, resized cells, or a mark that it was
 * drawn here, or removed again; a doorway keeps the edge it was moved to. Latest wins
 * by stamp, and a reset is a moment before which nothing counts, for
 * the pictures too.
 * Decision: DECISIONS.md, the wall is curated by default, yours to rearrange here.
 */

import type { Get, Set, SliceContext } from "../utils/actions.js";
import { keptAfter, latest, stamp, type Stamped, type When } from "../utils/stamped.js";
import type { Store } from "../store.js";
import type { Edge } from "../../gallery/edges.js";
import type { Cells } from "../../gallery/works.js";

export type Mode = "browse" | "comment" | "edit";
export type Tool = "move" | "room" | "door" | "picture";

export interface RoomEdit {
  readonly name?: Stamped<string>;
  readonly cells?: Stamped<Cells>;
  /** True once drawn here rather than shipped, false once removed again, the later winning; its time orders the drawn rooms. */
  readonly drawn?: Stamped<boolean>;
}

export interface GallerySlice {
  readonly rooms: Readonly<Record<string, RoomEdit>>;
  /** The doorway between two rooms, by their pair key, on a chosen edge, or null once taken away. */
  readonly doorways: Readonly<Record<string, Stamped<Edge | null>>>;
  /** Edits at or before this time do not count. */
  readonly resetAt: number;
  readonly mode: Mode;
  readonly tool: Tool;
  /** The room drawn here whose name is being asked for, in place; none otherwise. */
  readonly naming: string | undefined;
  /** The rooms picked with a click in the Room tool, any room, the drawn ones to be removed together; never kept. */
  readonly selected: readonly string[];
  renameRoom(id: string, name: string, when?: When): void;
  resizeRoom(id: string, cells: Cells, when?: When): void;
  drawRoom(id: string, name: string, cells: Cells, when?: When): void;
  /** A room drawn here, taken away again. */
  removeRoom(id: string, when?: When): void;
  /** Put the doorway between two rooms on an edge of the wall they share, adding one if they had none. */
  moveDoor(pair: string, edge: Edge, when?: When): void;
  /** Take the doorway between two rooms away. */
  removeDoor(pair: string, when?: When): void;
  /** Every edit forgotten, pictures included: the gallery as it shipped. */
  reset(when?: When): void;
  setMode(mode: Mode): void;
  holdTool(tool: Tool): void;
  /** Ask for a room's name in place, as after drawing it; with none, ask no more. */
  askName(roomId: string | undefined): void;
  /** Pick a room and no other. */
  selectOnly(roomId: string): void;
  /** Pick a room beside the others, or let it go if picked. */
  toggleSelected(roomId: string): void;
  clearSelection(): void;
  /** Remove every drawn room picked, one removal each, and let the selection go. */
  removeSelected(when?: When): void;
}

export const createGallerySlice =
  (context: SliceContext) =>
  (set: Set<Store>, get: Get<Store>): GallerySlice => {
    const room = (id: string, at: number, change: (edit: RoomEdit) => RoomEdit): boolean => {
      if (at <= get().resetAt) {
        return false;
      }
      set((state) => ({ rooms: { ...state.rooms, [id]: change(state.rooms[id] ?? {}) } }));
      return true;
    };
    return {
      rooms: {},
      doorways: {},
      resetAt: 0,
      mode: "browse",
      tool: "move",
      naming: undefined,
      selected: [],

      renameRoom: (id, name, when) => {
        const { at, remote } = stamp(when);
        const done = room(id, at, (edit) => ({
          ...edit,
          name: latest(edit.name, { value: name, at }),
        }));
        if (done && !remote) {
          context.tell({ action: "renameRoom", args: [id, name], at });
        }
      },
      resizeRoom: (id, cells, when) => {
        const { at, remote } = stamp(when);
        const done = room(id, at, (edit) => ({
          ...edit,
          cells: latest(edit.cells, { value: cells, at }),
        }));
        if (done && !remote) {
          context.tell({ action: "resizeRoom", args: [id, cells], at });
        }
      },
      drawRoom: (id, name, cells, when) => {
        const { at, remote } = stamp(when);
        const done = room(id, at, (edit) => ({
          name: latest(edit.name, { value: name, at }),
          cells: latest(edit.cells, { value: cells, at }),
          drawn: latest(edit.drawn, { value: true, at }),
        }));
        if (done && !remote) {
          context.tell({ action: "drawRoom", args: [id, name, cells], at });
        }
      },
      removeRoom: (id, when) => {
        const { at, remote } = stamp(when);
        const done = room(id, at, (edit) => ({
          ...edit,
          drawn: latest(edit.drawn, { value: false, at }),
        }));
        if (done && !remote) {
          context.tell({ action: "removeRoom", args: [id], at });
        }
      },
      moveDoor: (pair, edge, when) => {
        const { at, remote } = stamp(when);
        if (at <= get().resetAt) {
          return;
        }
        set((state) => ({
          doorways: {
            ...state.doorways,
            [pair]: latest(state.doorways[pair], { value: edge, at }),
          },
        }));
        if (!remote) {
          context.tell({ action: "moveDoor", args: [pair, edge], at });
        }
      },
      removeDoor: (pair, when) => {
        const { at, remote } = stamp(when);
        if (at <= get().resetAt) {
          return;
        }
        set((state) => ({
          doorways: {
            ...state.doorways,
            [pair]: latest(state.doorways[pair], { value: null, at }),
          },
        }));
        if (!remote) {
          context.tell({ action: "removeDoor", args: [pair], at });
        }
      },
      reset: (when) => {
        const { at, remote } = stamp(when);
        if (at <= get().resetAt) {
          return;
        }
        set((state) => ({
          resetAt: at,
          rooms: roomsAfter(state.rooms, at),
          doorways: keptAfter(state.doorways, at),
        }));
        get().clearPictures(at);
        if (!remote) {
          context.tell({ action: "reset", args: [], at });
        }
      },
      setMode: (mode) => {
        // A change of mode lets the selection go: it only means something in edit mode.
        set({ mode, selected: [] });
      },
      holdTool: (tool) => {
        // A change of tool lets the selection go: it only means something to the Room tool.
        set({ tool, selected: [] });
      },
      askName: (roomId) => {
        set({ naming: roomId });
      },
      selectOnly: (roomId) => {
        set({ selected: [roomId] });
      },
      toggleSelected: (roomId) => {
        set((state) => ({
          selected: state.selected.includes(roomId)
            ? state.selected.filter((id) => id !== roomId)
            : [...state.selected, roomId],
        }));
      },
      clearSelection: () => {
        set({ selected: [] });
      },
      removeSelected: (when) => {
        const { selected, rooms, removeRoom } = get();
        set({ selected: [] });
        for (const id of selected) {
          if (rooms[id]?.drawn?.value === true) {
            removeRoom(id, when);
          }
        }
      },
    };
  };

// Each room's edits from after `at`, and no room left with none.
function roomsAfter(
  rooms: Readonly<Record<string, RoomEdit>>,
  at: number
): Record<string, RoomEdit> {
  const kept: Record<string, RoomEdit> = {};
  for (const [id, edit] of Object.entries(rooms)) {
    const after: RoomEdit = {
      ...(edit.name !== undefined && edit.name.at > at ? { name: edit.name } : {}),
      ...(edit.cells !== undefined && edit.cells.at > at ? { cells: edit.cells } : {}),
      ...(edit.drawn !== undefined && edit.drawn.at > at ? { drawn: edit.drawn } : {}),
    };
    if (Object.keys(after).length > 0) {
      kept[id] = after;
    }
  }
  return kept;
}
