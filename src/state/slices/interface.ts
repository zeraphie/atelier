/**
 * ─ Interface slice ─
 *
 * What the interface is doing, never kept and never shared: the mode,
 * the tool held in edit mode, the room whose name is being asked for,
 * the rooms picked, and where a picture is being hung. Apart from the
 * gallery slice, which is the gallery as it was changed, so a reload
 * starts browsing whatever was going on.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import type { Point } from "../../geometry.js";
import type { Get, Set } from "../utils/actions.js";
import type { When } from "../utils/stamped.js";
import type { Store } from "../store.js";

export type Mode = "browse" | "comment" | "edit";
export type Tool = "move" | "room" | "door" | "picture";

export interface InterfaceSlice {
  readonly mode: Mode;
  readonly tool: Tool;
  /** The room drawn here whose name is being asked for, in place; none otherwise. */
  readonly naming: string | undefined;
  /** The rooms picked with a click in the Room tool, any room, the drawn ones to be removed together. */
  readonly selected: readonly string[];
  /** Where a picture of your own is being hung: a file, then its details, are being asked for; none otherwise. */
  readonly hangingAt: Point | undefined;
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
  /** Ask for a picture to hang at a point; with none, ask no more. */
  askPicture(at: Point | undefined): void;
}

export function createInterfaceSlice(set: Set<Store>, get: Get<Store>): InterfaceSlice {
  return {
    mode: "browse",
    tool: "move",
    naming: undefined,
    selected: [],
    hangingAt: undefined,
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
    askPicture: (at) => {
      set({ hangingAt: at });
    },
  };
}
