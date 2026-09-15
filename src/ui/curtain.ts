/**
 * ─ Curtain ─
 *
 * The mark covers the window from the first byte until the stage has
 * a frame. It draws itself once, the moment the page paints, and the
 * app's chunks wait to run until it is done, since they run on the
 * same thread and would stall it; the word under the mark moves on
 * the compositor throughout, for one full roll at least. The curtain
 * opens at the latest of the draw, the roll and the first frame, and
 * the two halves part with their share of the letters. A load that fails says
 * so under the mark. The lengths are written down twice: here, and in
 * the rules and markup of index.html.
 * Decision: DECISIONS.md, a loader that draws the mark.
 */

// How long a letter takes to draw, the head start the last letter has
// on the first, the slowest roll of the loading word, and how long the halves
// take to leave.
const DRAW_MS = 700;
const LAST_LETTER_MS = 660;
const SLOWEST_ROLL_MS = 1500;
const OPEN_MS = 400;

let drawn: Promise<void> | undefined;
let rolled: Promise<void> | undefined;
let isRaised = false;

/** Resolves once the mark has finished drawing; at once when there is no mark or motion is reduced. */
export function whenMarkDrawn(): Promise<void> {
  drawn ??= drawnOnce(document.querySelector("#loading use:last-of-type"));
  return drawn;
}

// The word is up from the first paint and stays for one full roll of its
// slowest letter at least, so a fast load never flashes it. That letter's
// own animation clock says how much of the roll is left; under reduced
// motion there is no animation, and nothing to wait for.
function whenWordRolled(): Promise<void> {
  rolled ??= new Promise((resolve) => {
    const clock = slowestRoll()?.currentTime;
    const elapsed = clock === undefined || clock === null ? SLOWEST_ROLL_MS : Number(clock);
    setTimeout(resolve, Math.max(0, SLOWEST_ROLL_MS - elapsed));
  });
  return rolled;
}

function slowestRoll(): Animation | undefined {
  const letters = [...document.querySelectorAll<HTMLElement>("#loading .roll")];
  const animations = letters.flatMap((letter) => letter.getAnimations());
  return animations.reduce<Animation | undefined>((slowest, animation) => {
    const duration = Number(animation.effect?.getTiming().duration ?? 0);
    const best = Number(slowest?.effect?.getTiming().duration ?? 0);
    return duration > best ? animation : slowest;
  }, undefined);
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
  void Promise.all([whenMarkDrawn(), whenWordRolled()]).then(() => {
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
