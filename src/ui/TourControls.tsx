import { useSyncExternalStore } from "react";
import { useTour } from "./canvas-context.js";

const BUTTON =
  "h-8 min-w-8 px-2 font-mono text-sm text-ink hover:bg-canvas active:bg-line " +
  "disabled:text-muted disabled:hover:bg-transparent " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";

/** Previous and next along the tour, with where the walk stands. */
export function TourControls() {
  const tour = useTour();
  const at = useSyncExternalStore(
    (listener) => tour?.stop.subscribe(listener) ?? (() => {}),
    () => tour?.stop.current ?? -1
  );
  if (tour === undefined) {
    return null;
  }
  const count = tour.count;
  return (
    <div className="absolute bottom-4 left-4 flex overflow-hidden rounded-md border border-line bg-surface shadow-sm">
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
        {at < 0 ? "Tour" : `${at + 1} of ${count}`}
      </span>
      <button
        type="button"
        className={BUTTON}
        aria-label={at < 0 ? "Start the tour" : "Next work"}
        disabled={at >= count - 1}
        onClick={() => tour.next()}
      >
        ›
      </button>
    </div>
  );
}
