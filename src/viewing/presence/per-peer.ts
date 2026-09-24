/**
 * ─ Per peer ─
 *
 * A thing kept per peer, in a value store apart from the React store:
 * placed as it comes, dropped with null or when the peer goes, and
 * cleared on leaving. The cursors and the looks are this; they change
 * every frame, are never saved, and only their layer reads them, so
 * the store that re-renders the interface never hears of them.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { ValueStore } from "../../canvas/value-store.js";
import { without } from "../../state/utils/records.js";

export interface PerPeer<T> {
  /** Every peer's thing, by peer id. */
  readonly store: ValueStore<Readonly<Record<string, T>>>;
  /** A peer's thing is `value`, or, with null, gone. */
  place(peerId: string, value: T | null): void;
  /** A peer's thing is gone, as when the peer is. */
  drop(peerId: string): void;
  /** Nothing kept for anyone, as on leaving a viewing. */
  clear(): void;
}

/** A store of one thing per peer, by peer id; a change that changes nothing tells no one. */
export function perPeer<T>(): PerPeer<T> {
  const store = new ValueStore<Readonly<Record<string, T>>>({});
  const drop = (peerId: string): void => {
    if (peerId in store.current) {
      store.set(without(store.current, peerId));
    }
  };
  return {
    store,
    place: (peerId, value) => {
      if (value === null) {
        drop(peerId);
      } else {
        store.set({ ...store.current, [peerId]: value });
      }
    },
    drop,
    clear: () => {
      if (Object.keys(store.current).length > 0) {
        store.set({});
      }
    },
  };
}
