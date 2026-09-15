/**
 * ─ Curtain ─
 *
 * The mark covers the window from the first byte until the stage has
 * a frame: it draws itself once, then the two halves part and take
 * their share of the letters with them. The draw runs on the main
 * thread, so it starts only once the modules have evaluated and the
 * stage is made only once it has ended; nothing heavy shares its
 * time. The draw is never cut short either, since a mark half-drawn
 * reads as a fault rather than as a wait, so the curtain opens at the
 * later of the draw's end and the first frame. The lengths are
 * written down twice: here, and in the rules of index.html.
 * Decision: DECISIONS.md, a loader that draws the mark.
 */

// How long a letter takes to draw, the head start the first gives the
// second, and how long the halves take to leave.
const DRAW_MS = 800;
const SECOND_LETTER_MS = 180;
const OPEN_MS = 400;

let drawn: Promise<void> | undefined;
let isRaised = false;

/** Start the draw. Called once the app's modules are in, so their evaluation cannot stall it. */
export function drawMark(): void {
  document.getElementById("loading")?.classList.add("draw");
}

/** Resolves once the mark has finished drawing; at once when there is no mark or motion is reduced. */
export function whenMarkDrawn(): Promise<void> {
  drawn ??= drawnOnce(document.getElementById("loading"));
  return drawn;
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
  void whenMarkDrawn().then(() => {
    loading.classList.add("done");
    // Taken off on a timer rather than on transitionend, which does not
    // fire while the page is not being painted, and the curtain would
    // then sit over the canvas for good.
    setTimeout(() => loading.remove(), OPEN_MS);
  });
}

// Nothing animates while the page is unpainted, so a timer bounds the
// wait; reduced motion draws the mark still, and waits for nothing.
function drawnOnce(mark: Element | null): Promise<void> {
  if (mark === null || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    mark.querySelector(".l")?.addEventListener("animationend", () => resolve(), { once: true });
    setTimeout(resolve, DRAW_MS + SECOND_LETTER_MS + OPEN_MS);
  });
}
