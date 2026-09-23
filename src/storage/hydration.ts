/**
 * ─ Hydration ─
 *
 * A roll call of the stores that load from the database, so the
 * curtain can wait for the gallery to be whole rather than open on an
 * empty one. Each store is expected by name and reports when it has
 * loaded; the call ends when every name has, or at a deadline, since a
 * database that never answers, as some private windows have, must not
 * hold the door shut for good.
 * Decision: DECISIONS.md, persistence.
 */

/** Runs a callback after `ms`: setTimeout, or a test's own clock. */
export type Timer = (callback: () => void, ms: number) => void;

export class Hydration {
  private readonly pending = new Set<string>();
  private readonly done: Promise<void>;
  private settle: () => void = () => {};
  private isSettled = false;

  constructor(deadlineMs: number, timer: Timer = setTimeout) {
    this.done = new Promise((resolve) => {
      this.settle = () => {
        this.isSettled = true;
        resolve();
      };
    });
    timer(() => this.settle(), deadlineMs);
  }

  /** A store that will load; the call waits for it. */
  expect(name: string): void {
    if (!this.isSettled) {
      this.pending.add(name);
    }
  }

  /** That store has loaded, or failed to and carries on empty. Saying so twice is harmless. */
  loaded(name: string): void {
    this.pending.delete(name);
    if (this.pending.size === 0) {
      this.settle();
    }
  }

  /** Resolves once every expected store has loaded, or the deadline has passed. */
  whenDone(): Promise<void> {
    if (this.pending.size === 0) {
      this.settle();
    }
    return this.done;
  }

  /** The stores still to load, for a named state while waiting. */
  get waiting(): readonly string[] {
    return [...this.pending];
  }
}
