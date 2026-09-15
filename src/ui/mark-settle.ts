/**
 * ─ Mark settle ─
 *
 * The shortest way from wherever a looping letter is to fully drawn,
 * as arithmetic on its animation's clock, so the curtain module only
 * has to read the clock and act. The loop alternates: even iterations
 * draw and odd ones undraw, so a letter mid-undraw is turned round
 * rather than let run empty and back. Time into the iteration is the
 * measure, not progress, which is eased and would fire a timer early.
 */

export interface LetterClock {
  /** Where the animation's clock stands, in ms, the delay included. */
  readonly currentTime: number;
  /** The animation's delay, in ms. */
  readonly delay: number;
}

export interface WayToDrawn {
  /** Whether the letter is undrawing and has to be turned round first. */
  readonly reverse: boolean;
  /** Milliseconds until it stands drawn, once turned round if it has to be. */
  readonly remainingMs: number;
}

/** How a letter whose draw and undraw each take `drawMs` gets back to drawn. */
export function wayToDrawn(clock: LetterClock, drawMs: number): WayToDrawn {
  const active = clock.currentTime - clock.delay;
  // Still in the delay: the first draw has yet to start, and it runs forward.
  if (active < 0) {
    return { reverse: false, remainingMs: -active + drawMs };
  }
  const iteration = Math.floor(active / drawMs);
  const within = active - iteration * drawMs;
  const reverse = iteration % 2 === 1;
  return { reverse, remainingMs: reverse ? within : drawMs - within };
}
