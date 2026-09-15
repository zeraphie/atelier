/**
 * ─ Comment interface store ─
 *
 * What the comment interface is doing right now: whether the next tap
 * on the canvas places a comment, a draft waiting to be written, and
 * which thread is open. Placing is single-shot: the tap that places a
 * draft also leaves the mode, so there is no state to be stuck in.
 * None of this persists.
 * Decision: DECISIONS.md, adding a comment: a button and a menu, not a bare tap.
 */

import { create } from "zustand";
import type { Point } from "../geometry.js";

export type Mode = "browse" | "comment";

export interface UiStore {
  readonly mode: Mode;
  /** Where a comment is being written, in world units, if one is. */
  readonly draftAt: Point | undefined;
  readonly openThreadId: string | undefined;
  setMode(mode: Mode): void;
  /** Begin a comment at a world point; closes any thread and leaves comment mode. */
  startDraft(at: Point): void;
  cancelDraft(): void;
  openThread(id: string): void;
  closeThread(): void;
}

export const useUiStore = create<UiStore>()((set) => ({
  mode: "browse",
  draftAt: undefined,
  openThreadId: undefined,
  setMode: (mode) => {
    set({ mode });
  },
  startDraft: (at) => {
    set({ draftAt: at, openThreadId: undefined, mode: "browse" });
  },
  cancelDraft: () => {
    set({ draftAt: undefined });
  },
  openThread: (id) => {
    set({ openThreadId: id, draftAt: undefined });
  },
  closeThread: () => {
    set({ openThreadId: undefined });
  },
}));
