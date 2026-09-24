/**
 * ─ Viewing slice ─
 *
 * Which shared viewing this screen is in, if any, and who else is
 * there: each peer by id, with the name it said hello with, or none
 * until it does; whose view this screen follows, and who follows it;
 * and the proposal to put everything back, while one is open, with
 * every answer to it, since putting everything back takes everyone
 * here. What the interface shows as the viewing's status. A
 * proposal's tally is read beside the slice: whoever is here now
 * counts, and a decline stands even once its peer has left.
 * Never kept: a reload joins again from the address, and the peers
 * announce themselves afresh.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { Get, Set } from "../utils/actions.js";
import { without } from "../utils/records.js";
import type { Store } from "../store.js";

export interface Peer {
  /** The name the peer said hello with; empty until it has. */
  readonly name: string;
  /** The peer's browser id, from its hello: what its hangings are owned by. */
  readonly user?: string;
  /** The peer's colour, by swatch id, from its hello. */
  readonly color?: string;
}

/** A proposal to put everything back: open until everyone here has agreed, its proposer withdraws it, or this screen closes it. */
export interface Proposal {
  /** What an answer and a withdrawal name. */
  readonly id: string;
  /** The peer who proposed it, or none when this screen did. */
  readonly by: string | undefined;
  /** The time the reset would be made at, the same on every screen. */
  readonly at: number;
  /** The peers' answers by peer id, true to put back and false to keep, the proposer's yes from the start; a leaver's stands. */
  readonly answers: Readonly<Record<string, boolean>>;
  /** This screen's answer, or none yet. */
  readonly mine: boolean | undefined;
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
  /** The proposal to put everything back that is open, or none. */
  readonly proposal: Proposal | undefined;
  enteredViewing(code: string): void;
  leftViewing(): void;
  peerJoined(peerId: string): void;
  /** A peer said hello, or said a new name. */
  peerNamed(peerId: string, name: string, user: string, color: string): void;
  /** A peer left: gone from the peers, followed no more, and its proposal with it; its answer stands. */
  peerLeft(peerId: string): void;
  /** Follow a peer: their view becomes this screen's until anything else moves it. */
  follow(peerId: string): void;
  unfollow(): void;
  /** A peer said it is following this screen, or no longer. */
  followedBy(peerId: string, is: boolean): void;
  /** Propose putting everything back at `at`, as `id`, agreeing to it; nothing while one is open. */
  propose(id: string, at: number): void;
  /** A peer proposed putting everything back; the earlier of two proposals stays, and one from before the reset is nothing. */
  proposedBy(peerId: string, id: string, at: number): void;
  /** Answer the open proposal: true to put back, false to keep as it is. */
  answerProposal(is: boolean): void;
  /** A peer answered the proposal `id`; nothing unless it is the one open. */
  answeredBy(peerId: string, id: string, is: boolean): void;
  /** Withdraw the proposal, when this screen made it. */
  withdrawProposal(): void;
  /** A peer withdrew the proposal `id`; nothing unless it is the one open and theirs. */
  withdrawnBy(peerId: string, id: string): void;
  /** Close the proposal on this screen: gone from here, whatever the others do. */
  closeProposal(): void;
}

// What a viewing starts and ends with: no one here, no one followed, nothing proposed.
const NOBODY = { peers: {}, following: undefined, followers: [], proposal: undefined } as const;

export function createViewingSlice(set: Set<Store>, _get: Get<Store>): ViewingSlice {
  // The open proposal changed, or gone; nothing when none is open or it is left as it was.
  const proposal = (change: (open: Proposal) => Proposal | undefined): void => {
    set((state) => {
      if (state.proposal === undefined) {
        return state;
      }
      const next = change(state.proposal);
      return next === state.proposal ? state : { proposal: next };
    });
  };
  return {
    viewingCode: undefined,
    ...NOBODY,
    enteredViewing: (code) => {
      set({ viewingCode: code, ...NOBODY });
    },
    leftViewing: () => {
      set({ viewingCode: undefined, ...NOBODY });
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
      set((state) => ({
        peers: without(state.peers, peerId),
        following: state.following === peerId ? undefined : state.following,
        followers: state.followers.filter((id) => id !== peerId),
        proposal: state.proposal?.by === peerId ? undefined : state.proposal,
      }));
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
    propose: (id, at) => {
      set((state) =>
        state.proposal === undefined
          ? { proposal: { id, by: undefined, at, answers: {}, mine: true } }
          : state
      );
    },
    proposedBy: (peerId, id, at) => {
      set((state) => {
        if (at <= state.resetAt) {
          return state;
        }
        const theirs: Proposal = {
          id,
          by: peerId,
          at,
          answers: { [peerId]: true },
          mine: undefined,
        };
        const next = earlier(state.proposal, theirs);
        return next === state.proposal ? state : { proposal: next };
      });
    },
    answerProposal: (is) => {
      proposal((open) => ({ ...open, mine: is }));
    },
    answeredBy: (peerId, id, is) => {
      proposal((open) =>
        open.id === id ? { ...open, answers: { ...open.answers, [peerId]: is } } : open
      );
    },
    withdrawProposal: () => {
      proposal((open) => (open.by === undefined ? undefined : open));
    },
    withdrawnBy: (peerId, id) => {
      proposal((open) => (open.by === peerId && open.id === id ? undefined : open));
    },
    closeProposal: () => {
      set({ proposal: undefined });
    },
  };
}

// The earlier of two proposals, by time then by id, so every screen keeps
// the same one when two were made at once; the one held on a repeat.
function earlier(held: Proposal | undefined, heard: Proposal): Proposal {
  if (held === undefined) {
    return heard;
  }
  if (held.id === heard.id || held.at < heard.at) {
    return held;
  }
  return held.at === heard.at && held.id < heard.id ? held : heard;
}

/** A proposal's tally: how many count, being here now; how many of them agreed; how many declined, here or gone. */
export interface Tally {
  readonly counted: number;
  readonly agreed: number;
  readonly declined: number;
}

/** The tally of the open proposal: this screen and the peers here count, and every decline given stands; noughts when none is open. */
export function tallyOf(state: Pick<ViewingSlice, "peers" | "proposal">): Tally {
  const { peers, proposal } = state;
  if (proposal === undefined) {
    return { counted: 0, agreed: 0, declined: 0 };
  }
  const here = [proposal.mine, ...Object.keys(peers).map((peerId) => proposal.answers[peerId])];
  const given = [proposal.mine, ...Object.values(proposal.answers)];
  return {
    counted: here.length,
    agreed: here.filter((answer) => answer === true).length,
    declined: given.filter((answer) => answer === false).length,
  };
}

/** Whether everyone here has agreed and no one has declined: the reset may be made. */
export function isUnanimous(tally: Tally): boolean {
  return tally.counted > 0 && tally.agreed === tally.counted && tally.declined === 0;
}

/** Whether anyone has declined, here or gone: the reset cannot be made. */
export function isDeclined(tally: Tally): boolean {
  return tally.declined > 0;
}
