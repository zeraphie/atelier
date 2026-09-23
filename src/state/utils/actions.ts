/**
 * ─ Actions told ─
 *
 * Every action a person takes on a slice is told here by name, with
 * its arguments and its time, which is how a viewing will hear of
 * it and replay it by name on other screens. A replayed action is not
 * told again. Nothing listens until a viewing does. A slice acts
 * through `acting`, which is the one place a write is stamped,
 * refused from before the reset, and told.
 */

import { stamp, type When } from "./stamped.js";

export interface ActionCall {
  readonly action: string;
  readonly args: readonly unknown[];
  readonly at: number;
}

export type ActionListener = (call: ActionCall) => void;

const listeners = new Set<ActionListener>();

/** Hear every action this screen takes; returns the unsubscribe function. */
export function onAction(listener: ActionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function tell(call: ActionCall): void {
  for (const listener of listeners) {
    listener(call);
  }
}

/** What a slice needs from outside itself: who is acting, and where to tell. */
export interface SliceContext {
  readonly who: () => string;
  /** The colour the person acts in, by swatch id. */
  readonly color: () => string;
  readonly tell: (call: ActionCall) => void;
}

/** A stamped write: given its time, refused from before the reset, and told by name unless it came from a peer. */
export type Act = (
  when: When | undefined,
  call: Omit<ActionCall, "at">,
  write: (at: number) => void
) => void;

/** The way a slice acts, over the store's reset floor and the context's telling. */
export function acting(get: () => { readonly resetAt: number }, context: SliceContext): Act {
  return (when, call, write) => {
    const { at, remote } = stamp(when);
    if (at <= get().resetAt) {
      return;
    }
    write(at);
    if (!remote) {
      context.tell({ ...call, at });
    }
  };
}

/** How a slice sets and reads the store it is part of; zustand's own `set` and `get` fit. */
export type Set<S> = (partial: Partial<S> | ((state: S) => Partial<S>)) => void;
export type Get<S> = () => S;
