/**
 * ─ Curtain ─
 *
 * The mark covers the window from the first byte until the stage has
 * a frame. It draws and undraws itself the whole time, since how long
 * the wait is nobody knows in advance. Once the frame is in, each
 * letter takes the shortest way back to fully drawn and is held
 * there, then the two halves part with their share of the letters. A
 * load that fails says so in place of the loop. The lengths are
 * written down twice: here, and in the rules of index.html.
 * Decision: DECISIONS.md, a loader that draws the mark.
 */

import { wayToDrawn } from "./mark-settle.js";

// How long a letter takes to draw or undraw, and how long the halves
// take to leave. The second letter's head start is in the page's rules
// alone; the clock reads it back as the animation's delay.
const DRAW_MS = 800;
const OPEN_MS = 400;
// Two frames: the timer that backs the boundary event lands a little
// after it, never before, so a missed event costs a hairline and an
// early timer never cuts a stroke short.
const TIMER_GRACE_MS = 32;

let isRaised = false;

/** Open the curtain once every letter stands drawn. Safe to call more than once; the first call counts. */
export function raiseCurtain(): void {
  if (isRaised) {
    return;
  }
  isRaised = true;
  const loading = document.getElementById("loading");
  if (loading === null) {
    return;
  }
  const letters = [...loading.querySelectorAll<SVGElement>("use")];
  void Promise.all(letters.map(hold)).then(() => {
    loading.classList.add("done");
    // Taken off on a timer rather than on transitionend, which does not
    // fire while the page is not being painted, and the curtain would
    // then sit over the canvas for good.
    setTimeout(() => loading.remove(), OPEN_MS);
  });
}

/** Stop the loop and say the load failed; only a reload helps from here. */
export function failLoader(): void {
  const loading = document.getElementById("loading");
  if (loading !== null) {
    loading.dataset["state"] = "failed";
  }
}

// Bring one letter to rest, drawn, by the shortest way: the boundary it
// heads for is caught by its event, and by a timer for the same moment,
// since nothing animates while the page is unpainted.
function hold(letter: SVGElement): Promise<void> {
  const animation = letter.getAnimations()[0];
  // Reduced motion: no animation, and the letter already stands drawn.
  if (animation === undefined) {
    return Promise.resolve();
  }
  const way = wayToDrawn(
    {
      currentTime: Number(animation.currentTime ?? 0),
      delay: animation.effect?.getComputedTiming().delay ?? 0,
    },
    DRAW_MS
  );
  if (way.reverse) {
    animation.reverse();
  }
  return new Promise((resolve) => {
    const drawn = (): void => {
      letter.classList.add("drawn");
      resolve();
    };
    letter.addEventListener("animationiteration", drawn, { once: true });
    setTimeout(drawn, way.remainingMs + TIMER_GRACE_MS);
  });
}
