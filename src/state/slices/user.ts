/**
 * ─ User slice ─
 *
 * Who this browser is: the name comments are made under, "Visitor" and
 * a number until it is set, and the rooms it has been in, so a room can
 * be found again without its link. Kept once, whatever room is open.
 * Decision: DECISIONS.md, who is commenting.
 */

import type { Get, Set } from "../actions.js";
import type { OwnStore } from "../own-store.js";

export interface Visited {
  readonly name: string;
  /** When last there. */
  readonly at: number;
}

export interface UserSlice {
  readonly name: string;
  readonly rooms: Readonly<Record<string, Visited>>;
  setName(name: string): void;
  /** Remember a room as one this browser has been in. */
  noteRoom(id: string, name: string): void;
}

// A name to comment under until the person types their own.
function visitorName(): string {
  return `Visitor ${Math.floor(100 + Math.random() * 900)}`;
}

export function createUserSlice(set: Set<OwnStore>, _get: Get<OwnStore>): UserSlice {
  return {
    name: visitorName(),
    rooms: {},
    setName: (name) => {
      set({ name: name.trim() || visitorName() });
    },
    noteRoom: (id, name) => {
      set((state) => ({ rooms: { ...state.rooms, [id]: { name, at: Date.now() } } }));
    },
  };
}
