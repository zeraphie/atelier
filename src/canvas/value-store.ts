/**
 * ─ Value store ─
 *
 * One value and its listeners, the least a plain module needs for
 * React to subscribe to it: the canvas size, the tour, the grid
 * switch, the pointer, and what the peers say. A set that changes
 * nothing tells no one.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

/** One value and its listeners: what React needs from a plain module to subscribe to it. */
export class ValueStore<T> {
  private value: T;
  private readonly listeners = new Set<(value: T) => void>();

  constructor(initial: T) {
    this.value = initial;
  }

  get current(): T {
    return this.value;
  }

  /** Replace the value; listeners fire only when it actually changed. */
  set(next: T): void {
    if (Object.is(next, this.value)) {
      return;
    }
    this.value = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }

  /** Subscribe to changes; returns the unsubscribe function. Bound, so React can hold it across renders. */
  readonly subscribe = (listener: (value: T) => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}
