/**
 * ─ Actions told ─
 *
 * Every action a person takes on a slice is told here by name, with
 * its arguments and its time, which is how a shared room will hear of
 * it and replay it by name on other screens. A replayed action is not
 * told again. Nothing listens until a room does.
 */

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

/** How a slice sets and reads the store it is part of; zustand's own `set` and `get` fit. */
export type Set<S> = (partial: Partial<S> | ((state: S) => Partial<S>)) => void;
export type Get<S> = () => S;
