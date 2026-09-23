/**
 * ─ Stamped ─
 *
 * A value and when it was set. Every value an action sets is stamped,
 * and an action keeps the later of what it holds and what it is given,
 * so two people applying the same actions in any order end up with
 * the same gallery, and a repeat changes nothing.
 */

export interface Stamped<T> {
  readonly value: T;
  readonly at: number;
}

/** When an action happens: now, here, unless a peer's replay says otherwise. */
export interface When {
  readonly at: number;
  /** From another screen: applied, and not told again. */
  readonly remote?: boolean;
}

/** The action's time: the one given, or now. */
export function stamp(when?: When): When {
  return when ?? { at: Date.now() };
}

/** The later of two stamped values; the one held on a tie, so a repeat is a no-op. */
export function latest<T>(current: Stamped<T> | undefined, next: Stamped<T>): Stamped<T> {
  return current !== undefined && current.at >= next.at ? current : next;
}

/** The entries of `map` set after `at`; the rest are gone. */
export function keptAfter<T>(
  map: Readonly<Record<string, Stamped<T>>>,
  at: number
): Record<string, Stamped<T>> {
  return Object.fromEntries(Object.entries(map).filter(([, stamped]) => stamped.at > at));
}
