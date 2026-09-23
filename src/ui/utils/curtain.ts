/**
 * ─ Curtain ─
 *
 * The mark covers the window from the first byte until the stage has
 * a frame. It draws itself once, the moment the page paints, and the
 * app's chunks wait to run until it is done, since they run on the
 * same thread and would stall it; the line under the mark sweeps on
 * the compositor throughout, for one full sweep at least. The curtain
 * opens at the latest of the draw, the sweep and the first frame, and
 * the two halves part with their share of the letters; the canvas host
 * asks for it only once the stores have loaded as well. A load that
 * fails says so under the mark. The lengths are written down twice:
 * here, and in the rules and markup of index.html.
 * Decision: DECISIONS.md, a loader that draws the mark.
 */

// How long a letter takes to draw, the head start the last letter has
// on the first, one sweep of the line, and how long the halves take to leave.
const DRAW_MS = 700;
const LAST_LETTER_MS = 660;
const SWEEP_MS = 1200;
const OPEN_MS = 400;

let drawn: Promise<void> | undefined;
let swept: Promise<void> | undefined;
let isRaised = false;

/** Resolves once the mark has finished drawing; at once when there is no mark or motion is reduced. */
export function whenMarkDrawn(): Promise<void> {
  drawn ??= drawnOnce(document.querySelector("#loading use:last-of-type"));
  return drawn;
}

// The line is up from the first paint and stays for one full sweep at
// least, so a fast load never flashes it. Its own animation clock says how
// much of the sweep is left; under reduced motion there is no animation,
// and nothing to wait for.
function whenLineSwept(): Promise<void> {
  swept ??= new Promise((resolve) => {
    const sweep = document.querySelector("#loading .sweep")?.getAnimations()[0];
    const clock = sweep?.currentTime;
    const elapsed = clock === undefined || clock === null ? SWEEP_MS : Number(clock);
    setTimeout(resolve, Math.max(0, SWEEP_MS - elapsed));
  });
  return swept;
}

/** Open the curtain once the mark has drawn. Safe to call more than once; the first call counts. */
export function raiseCurtain(): void {
  if (isRaised) {
    return;
  }
  isRaised = true;
  const loading = document.getElementById("loading");
  if (loading === null) {
    return;
  }
  void Promise.all([whenMarkDrawn(), whenLineSwept()]).then(() => {
    loading.classList.add("done");
    // Taken off on a timer rather than on transitionend, which does not
    // fire while the page is not being painted, and the curtain would
    // then sit over the canvas for good.
    setTimeout(() => loading.remove(), OPEN_MS);
  });
}

/** Say the load failed; only a reload helps from here. */
export function failLoader(): void {
  const loading = document.getElementById("loading");
  if (loading !== null) {
    loading.dataset["state"] = "failed";
  }
}

// The last letter's draw, as the animation the page's rules started: its
// own promise says when it is done. Reduced motion has no animation and
// the mark stands drawn. Nothing animates while the page is unpainted,
// so a timer bounds the wait.
function drawnOnce(lastLetter: Element | null): Promise<void> {
  const animation = lastLetter?.getAnimations()[0];
  if (animation === undefined || animation.playState === "finished") {
    return Promise.resolve();
  }
  return Promise.race([
    animation.finished.then(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, DRAW_MS + LAST_LETTER_MS + OPEN_MS);
    }),
  ]);
}
