/**
 * ─ User slice ─
 *
 * Who this browser is: an id made once, which is what it owns things
 * by; the name comments are made under, "Visitor" and a number until
 * it is set; and the viewings it has been in, so one can be found
 * again without its link. Kept once, whatever viewing is
 * open.
 * Decision: DECISIONS.md, who is commenting.
 */

import type { Get, Set } from "../utils/actions.js";
import type { OwnStore } from "../own-store.js";

export interface Visited {
  /** When last there. */
  readonly at: number;
}

export interface UserSlice {
  /** This browser, made once and kept: what a hanging is owned by, whatever the name says. */
  readonly userId: string;
  readonly name: string;
  /** The viewings this browser has been in, by code. */
  readonly viewings: Readonly<Record<string, Visited>>;
  setName(name: string): void;
  /** Remember a viewing as one this browser has been in, now. */
  noteViewing(code: string): void;
}

// A name to comment under until the person types their own.
function visitorName(): string {
  return `Visitor ${Math.floor(100 + Math.random() * 900)}`;
}

export function createUserSlice(set: Set<OwnStore>, _get: Get<OwnStore>): UserSlice {
  return {
    userId: crypto.randomUUID(),
    name: visitorName(),
    viewings: {},
    setName: (name) => {
      set({ name: name.trim() || visitorName() });
    },
    noteViewing: (code) => {
      set((state) => ({ viewings: { ...state.viewings, [code]: { at: Date.now() } } }));
    },
  };
}
