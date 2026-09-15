/**
 * ─ Curtain ─
 *
 * The mark covers the window from the first byte until the stage has
 * a frame. It draws itself once, the moment the page paints, and the
 * app's chunks wait to run until it is done, since they run on the
 * same thread and would stall it; the word under the mark then moves
 * on the compositor while they run, for one full roll at least. The
 * curtain opens at the later of that and the first frame, and the two
 * halves part with their share of the letters. A load that fails says
 * so under the mark. The lengths are written down twice: here, and in
 * the rules and markup of index.html.
 * Decision: DECISIONS.md, a loader that draws the mark.
 */

// How long a letter takes to draw, the head start the first gives the
// second, the slowest roll of the loading word, and how long the halves
// take to leave.
const DRAW_MS = 800;
const SECOND_LETTER_MS = 180;
const SLOWEST_ROLL_MS = 1500;
const OPEN_MS = 400;

let drawn: Promise<void> | undefined;
let rolled: Promise<void> | undefined;
let isRaised = false;

/** Resolves once the mark has finished drawing; at once when there is no mark or motion is reduced. */
export function whenMarkDrawn(): Promise<void> {
  drawn ??= drawnOnce(document.querySelector("#loading .l"));
  return drawn;
}

// The word appears as the draw ends and stays for one full roll of its
// slowest letter at least, so a fast load never flashes it. Under reduced
// motion the word stands still and there is no roll to wait for.
function whenWordRolled(): Promise<void> {
  rolled ??= whenMarkDrawn().then(
    () =>
      new Promise((resolve) => {
        setTimeout(resolve, isMotionReduced() ? 0 : SLOWEST_ROLL_MS);
      })
  );
  return rolled;
}

function isMotionReduced(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  void whenWordRolled().then(() => {
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
      setTimeout(resolve, DRAW_MS + SECOND_LETTER_MS + OPEN_MS);
    }),
  ]);
}
