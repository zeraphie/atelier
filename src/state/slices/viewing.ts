/**
 * ─ Viewing slice ─
 *
 * Which shared viewing this screen is in, if any, and who else is
 * there: each peer by id, with the name it said hello with, or none
 * until it does. What the interface shows as the viewing's status.
 * Never kept: a reload joins again from the address, and the peers
 * announce themselves afresh.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import type { Get, Set } from "../utils/actions.js";
import type { Store } from "../store.js";

export interface Peer {
  /** The name the peer said hello with; empty until it has. */
  readonly name: string;
  /** The peer's browser id, from its hello: what its hangings are owned by. */
  readonly user?: string;
  /** The peer's colour, by swatch id, from its hello. */
  readonly color?: string;
}

export interface ViewingSlice {
  /** The viewing joined, by its code, or none for the solo gallery. */
  readonly viewingCode: string | undefined;
  /** The other screens in the viewing, by peer id. */
  readonly peers: Readonly<Record<string, Peer>>;
  enteredViewing(code: string): void;
  leftViewing(): void;
  peerJoined(peerId: string): void;
  /** A peer said hello, or said a new name. */
  peerNamed(peerId: string, name: string, user: string, color: string): void;
  peerLeft(peerId: string): void;
}

export function createViewingSlice(set: Set<Store>, _get: Get<Store>): ViewingSlice {
  return {
    viewingCode: undefined,
    peers: {},
    enteredViewing: (code) => {
      set({ viewingCode: code, peers: {} });
    },
    leftViewing: () => {
      set({ viewingCode: undefined, peers: {} });
    },
    peerJoined: (peerId) => {
      set((state) => ({
        peers: { ...state.peers, [peerId]: state.peers[peerId] ?? { name: "" } },
      }));
    },
    peerNamed: (peerId, name, user, color) => {
      set((state) => ({ peers: { ...state.peers, [peerId]: { name, user, color } } }));
    },
    peerLeft: (peerId) => {
      set((state) => {
        const { [peerId]: _gone, ...peers } = state.peers;
        return { peers };
      });
    },
  };
}
