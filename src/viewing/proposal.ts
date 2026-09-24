/**
 * ─ Proposal ─
 *
 * Putting everything back in a viewing takes everyone in it, and is
 * confirmed twice. Pressed with peers there, it proposes the reset
 * rather than making it: the proposal goes to every screen, each
 * answers, and once everyone here has agreed the proposer confirms
 * again, and the reset is one action told and replayed like any other,
 * which closes the proposal wherever it lands. This is the wire for it:
 * a proposal, an answer and a withdrawal sent as they are made and
 * handed to the viewing slice as they arrive; the proposal said again,
 * with the answers so far, to a peer who arrives while it is open; and
 * the watch that closes a proposal once its reset has happened. Alone,
 * there is no one to ask, and putting everything back is the reset it
 * was.
 * Decision: DECISIONS.md, putting everything back is unanimous.
 */

import { isUnanimous, tallyOf } from "../state/slices/viewing.js";
import { useStore, type Store } from "../state/store.js";
import {
  isResetAnswerMessage,
  isResetAskMessage,
  isResetWithdrawMessage,
  type ResetAnswerMessage,
  type ResetAskMessage,
  type ResetWithdrawMessage,
} from "./message.js";
import type { Transport } from "./transport.js";

let transport: Transport | undefined;
let stopWatching: () => void = () => {};

/** The transport proposals go out on from now, and the watch that closes them once reset; neither while the viewing is unbound. */
export function bindProposal(next: Transport | undefined): void {
  transport = next;
  stopWatching();
  stopWatching = next === undefined ? () => {} : useStore.subscribe(settle);
}

/** Put everything back as the viewing does it: alone, the reset itself; with peers, a proposal to them all, agreed to by you. */
export function proposeReset(): void {
  const state = useStore.getState();
  if (transport === undefined || Object.keys(state.peers).length === 0) {
    state.reset();
    return;
  }
  if (state.proposal !== undefined) {
    return;
  }
  const id = crypto.randomUUID();
  const at = Date.now();
  state.propose(id, at);
  const message: ResetAskMessage = { kind: "reset-ask", id, at };
  transport.send(message);
}

/** Answer the open proposal, yes to put back and no to keep as it is, and say so to everyone. */
export function answerReset(is: boolean): void {
  const state = useStore.getState();
  if (state.proposal === undefined) {
    return;
  }
  state.answerProposal(is);
  const message: ResetAnswerMessage = { kind: "reset-answer", id: state.proposal.id, is };
  transport?.send(message);
}

/** Put everything back, everyone here having agreed to the proposal this screen made: the reset itself, told to all like any action, which closes the proposal on every screen as it lands. */
export function confirmReset(): void {
  const state = useStore.getState();
  const { proposal } = state;
  if (proposal === undefined || proposal.by !== undefined || !isUnanimous(tallyOf(state))) {
    return;
  }
  state.reset();
}

/** Take back the proposal this screen made, for everyone. */
export function withdrawReset(): void {
  const state = useStore.getState();
  const { proposal } = state;
  if (proposal === undefined || proposal.by !== undefined) {
    return;
  }
  state.withdrawProposal();
  const message: ResetWithdrawMessage = { kind: "reset-withdraw", id: proposal.id };
  transport?.send(message);
}

/** The proposal this screen made, said again to a peer who just arrived, with the answers so far. */
export function sayProposalAgain(peerId: string): void {
  const { proposal } = useStore.getState();
  if (transport === undefined || proposal === undefined || proposal.by !== undefined) {
    return;
  }
  const message: ResetAskMessage = {
    kind: "reset-ask",
    id: proposal.id,
    at: proposal.at,
    answers: proposal.answers,
  };
  transport.send(message, peerId);
}

/** A peer's proposal, answer or withdrawal, handed to the store; false for any other message. */
export function receiveProposal(data: unknown, from: string): boolean {
  const state = useStore.getState();
  if (isResetAskMessage(data)) {
    state.proposedBy(from, data.id, data.at, data.answers);
  } else if (isResetAnswerMessage(data)) {
    state.answeredBy(from, data.id, data.is);
  } else if (isResetWithdrawMessage(data)) {
    state.withdrawnBy(from, data.id);
  } else {
    return false;
  }
  return true;
}

// A proposal closed on this screen once the reset it asked for has happened,
// however it came: the proposer's confirm, a peer's replay of it, or a snapshot.
function settle(state: Store): void {
  if (state.proposal !== undefined && state.proposal.at <= state.resetAt) {
    state.closeProposal();
  }
}
