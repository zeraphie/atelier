import { useSyncExternalStore } from "react";
import { useTour } from "./canvas-context.js";

const BUTTON =
  "h-8 min-w-8 px-2 font-mono text-sm text-ink hover:bg-canvas active:bg-line " +
  "disabled:text-muted disabled:hover:bg-transparent " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";
const PILL =
  "absolute bottom-4 left-4 flex overflow-hidden rounded-md border border-line bg-surface shadow-sm";

/** One button to start the tour; on it, previous and next, where it stands, and a way off. */
export function TourControls() {
  const tour = useTour();
  const at = useSyncExternalStore(
    (listener) => tour?.stop.subscribe(listener) ?? (() => {}),
    () => tour?.stop.current ?? -1
  );
  if (tour === undefined) {
    return null;
  }
  if (at < 0) {
    return (
      <div className={PILL}>
        <button
          type="button"
          className={`${BUTTON} px-3 font-sans`}
          aria-label="Start the tour"
          onClick={() => tour.start()}
        >
          Tour
        </button>
      </div>
    );
  }
  return (
    <div className={PILL}>
      <button
        type="button"
        className={BUTTON}
        aria-label="Previous work"
        disabled={at <= 0}
        onClick={() => tour.previous()}
      >
        ‹
      </button>
      <span className="flex h-8 items-center border-x border-line px-3 font-sans text-sm text-muted">
        {at + 1} of {tour.count}
      </span>
      <button
        type="button"
        className={BUTTON}
        aria-label="Next work"
        disabled={at >= tour.count - 1}
        onClick={() => tour.next()}
      >
        ›
      </button>
      <button
        type="button"
        className={`${BUTTON} border-l border-line`}
        aria-label="Leave the tour"
        onClick={() => tour.leave()}
      >
        ×
      </button>
    </div>
  );
}
