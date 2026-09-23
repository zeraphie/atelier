/**
 * ─ Room slice ─
 *
 * Which shared room this screen is in, if any, and who else is there,
 * by peer id: what the interface shows as the room's status. Never
 * kept: a reload joins again from the address, and the peers announce
 * themselves afresh.
 * Decision: DECISIONS.md, a room is opt-in by link and siloed.
 */

import type { Get, Set } from "../utils/actions.js";
import type { Store } from "../store.js";

export interface RoomSlice {
  /** The room joined, or none for the solo gallery. */
  readonly roomId: string | undefined;
  /** The other screens in the room, by peer id. */
  readonly peers: readonly string[];
  enteredRoom(id: string): void;
  leftRoom(): void;
  peerJoined(peerId: string): void;
  peerLeft(peerId: string): void;
}

export function createRoomSlice(set: Set<Store>, _get: Get<Store>): RoomSlice {
  return {
    roomId: undefined,
    peers: [],
    enteredRoom: (id) => {
      set({ roomId: id, peers: [] });
    },
    leftRoom: () => {
      set({ roomId: undefined, peers: [] });
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
