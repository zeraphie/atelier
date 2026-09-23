/**
 * ─ Viewing slice ─
 *
 * Which shared viewing this screen is in, if any, and who else is
 * there: each peer by id, with the name it said hello with, or none
 * until it does; whose view this screen follows, and who follows it.
 * What the interface shows as the viewing's status.
 * Never kept: a reload joins again from the address, and the peers
 * announce themselves afresh.
 * Decision: DECISIONS.md, everyone is in a viewing.
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
  /** The peer whose view this screen follows, or none. */
  readonly following: string | undefined;
  /** The peers following this screen. */
  readonly followers: readonly string[];
  enteredViewing(code: string): void;
  leftViewing(): void;
  peerJoined(peerId: string): void;
  /** A peer said hello, or said a new name. */
  peerNamed(peerId: string, name: string, user: string, color: string): void;
  peerLeft(peerId: string): void;
  /** Follow a peer: their view becomes this screen's until anything else moves it. */
  follow(peerId: string): void;
  unfollow(): void;
  /** A peer said it is following this screen, or no longer. */
  followedBy(peerId: string, is: boolean): void;
}

export function createViewingSlice(set: Set<Store>, _get: Get<Store>): ViewingSlice {
  return {
    viewingCode: undefined,
    peers: {},
    following: undefined,
    followers: [],
    enteredViewing: (code) => {
      set({ viewingCode: code, peers: {}, following: undefined, followers: [] });
    },
    leftViewing: () => {
      set({ viewingCode: undefined, peers: {}, following: undefined, followers: [] });
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
        return {
          peers,
          following: state.following === peerId ? undefined : state.following,
          followers: state.followers.filter((id) => id !== peerId),
        };
      });
    },
    follow: (peerId) => {
      set({ following: peerId });
    },
    unfollow: () => {
      set({ following: undefined });
    },
    followedBy: (peerId, is) => {
      set((state) => {
        const others = state.followers.filter((id) => id !== peerId);
        return { followers: is ? [...others, peerId] : others };
      });
    },
  };
}
