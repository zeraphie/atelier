import { useSyncExternalStore } from "react";
import { useTour } from "./canvas-context.js";

const BUTTON =
  "h-8 min-w-8 px-2 font-mono text-sm text-ink hover:bg-canvas active:bg-line " +
  "disabled:text-muted disabled:hover:bg-transparent " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";
const PILL =
  "absolute bottom-4 left-4 flex overflow-hidden rounded-md border border-line bg-surface shadow-sm";

/** Start and play the tour; on it, previous and next, where it stands, play or pause, and a way off. */
export function TourControls() {
  const tour = useTour();
  const at = useSyncExternalStore(
    (listener) => tour?.stop.subscribe(listener) ?? (() => {}),
    () => tour?.stop.current ?? -1
  );
  const isPlaying = useSyncExternalStore(
    (listener) => tour?.playing.subscribe(listener) ?? (() => {}),
    () => tour?.playing.current ?? false
  );
  if (tour === undefined) {
    return null;
  }
  const playOrPause = (
    <button
      type="button"
      className={`${BUTTON} border-l border-line`}
      aria-label={isPlaying ? "Pause the tour" : "Play the tour"}
      onClick={() => (isPlaying ? tour.pause() : tour.play())}
    >
      {isPlaying ? "❚❚" : "▶"}
    </button>
  );
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
        {playOrPause}
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
      {playOrPause}
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
