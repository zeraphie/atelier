/**
 * ─ Use value ─
 *
 * A value store read from React: the value it holds, re-rendering on
 * every change, through the one subscription React asks for. A store
 * that is not there yet, as the tour's before the canvas mounts, reads
 * as the value given for that.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import { useSyncExternalStore } from "react";
import type { ValueStore } from "../../canvas/value-store.js";

// Nothing to subscribe to, and nothing to unsubscribe: for a store not there yet.
const never = (): (() => void) => () => {};

/** The value `store` holds, re-rendering on every change; `whenNone` while there is no store. */
export function useValue<T>(store: ValueStore<T>): T;
export function useValue<T>(store: ValueStore<T> | undefined, whenNone: T): T;
export function useValue<T>(store: ValueStore<T> | undefined, whenNone?: T): T {
  return useSyncExternalStore(store?.subscribe ?? never, () =>
    store === undefined ? (whenNone as T) : store.current
  );
}
