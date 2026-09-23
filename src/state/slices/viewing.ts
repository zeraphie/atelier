/**
 * ─ Viewing slice ─
 *
 * Which shared viewing this screen is in, if any, and who else is
 * there, by peer id: what the interface shows as the viewing's status.
 * Never kept: a reload joins again from the address, and the peers
 * announce themselves afresh.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import type { Get, Set } from "../utils/actions.js";
import type { Store } from "../store.js";

export interface ViewingSlice {
  /** The viewing joined, by its code, or none for the solo gallery. */
  readonly viewingCode: string | undefined;
  /** The other screens in the viewing, by peer id. */
  readonly peers: readonly string[];
  enteredViewing(code: string): void;
  leftViewing(): void;
  peerJoined(peerId: string): void;
  peerLeft(peerId: string): void;
}

export function createViewingSlice(set: Set<Store>, _get: Get<Store>): ViewingSlice {
  return {
    viewingCode: undefined,
    peers: [],
    enteredViewing: (code) => {
      set({ viewingCode: code, peers: [] });
    },
    leftViewing: () => {
      set({ viewingCode: undefined, peers: [] });
    },
    peerJoined: (peerId) => {
      set((state) => ({
        peers: state.peers.includes(peerId) ? state.peers : [...state.peers, peerId],
      }));
    },
    peerLeft: (peerId) => {
      set((state) => ({ peers: state.peers.filter((id) => id !== peerId) }));
    },
  };
}
