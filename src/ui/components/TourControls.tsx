/**
 * ─ Tour controls ─
 *
 * Start and play the tour; on it, previous and next, where it stands,
 * play or pause, and a way off. The tour itself lives with the canvas;
 * this only watches where it stands and forwards presses.
 * Decision: DECISIONS.md, a route through the rooms.
 */

import { Pill, PillButton, PillLabel } from "../atoms/Pill.js";
import { useTour } from "../utils/canvas-context.js";
import { useValue } from "../utils/use-value.js";

export function TourControls() {
  const tour = useTour();
  const at = useValue(tour?.stop, -1);
  const isPlaying = useValue(tour?.playing, false);
  if (tour === undefined) {
    return null;
  }
  const playOrPause = (
    <PillButton
      divided
      aria-label={isPlaying ? "Pause the tour" : "Play the tour"}
      onClick={() => (isPlaying ? tour.pause() : tour.play())}
    >
      {isPlaying ? "❚❚" : "▶"}
    </PillButton>
  );
  if (at < 0) {
    return (
      <Pill className="absolute bottom-4 left-4">
        <PillButton className="px-3" aria-label="Start the tour" onClick={() => tour.start()}>
          Tour
        </PillButton>
        {playOrPause}
      </Pill>
    );
  }
  return (
    <Pill className="absolute bottom-4 left-4">
      <PillButton aria-label="Previous work" disabled={at <= 0} onClick={() => tour.previous()}>
        ‹
      </PillButton>
      <PillLabel>
        {at + 1} of {tour.count}
      </PillLabel>
      <PillButton
        aria-label="Next work"
        disabled={at >= tour.count - 1}
        onClick={() => tour.next()}
      >
        ›
      </PillButton>
      {playOrPause}
      <PillButton divided aria-label="Leave the tour" onClick={() => tour.leave()}>
        ×
      </PillButton>
    </Pill>
  );
}
