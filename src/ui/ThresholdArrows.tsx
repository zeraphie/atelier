/**
 * ─ Threshold arrows ─
 *
 * The way on, at each doorway: an arrow in the room the tour leaves,
 * pointing through to the next, placed by the same camera as the
 * pins. Pressing one glides the view to fill with the next room, so a
 * visitor can walk the plan door by door with no zoom out and in.
 * Decision: DECISIONS.md, arriving: the Foyer, a plaque, and an arrow at each threshold.
 */

import { Tooltip } from "radix-ui";
import { FIT_PADDING, moveTo, worldToScreen, type Point } from "../camera/index.js";
import { PLAN } from "../gallery/plan.js";
import { thresholdsOf, type Threshold } from "../gallery/thresholds.js";
import { useCameraState, useCanvas } from "./canvas-context.js";
import { Placed } from "./Placed.js";

const THRESHOLDS = thresholdsOf(PLAN);

const ARROW =
  "pointer-events-auto flex size-9 items-center justify-center " +
  "rounded-full border-2 border-accent bg-surface text-accent shadow-md " +
  "transition-[scale,background-color,color] hover:scale-110 hover:bg-accent hover:text-accent-ink " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";
// The glyph points right; the others are turns of it.
const GLYPH =
  "data-[direction=down]:rotate-90 data-[direction=left]:rotate-180 data-[direction=up]:-rotate-90";
const TIP = "z-20 rounded-md bg-ink px-2 py-1 font-sans text-xs text-surface shadow-md";

export function ThresholdArrows() {
  const camera = useCameraState();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {THRESHOLDS.map((threshold) => (
        <Arrow
          key={threshold.to.room.id}
          threshold={threshold}
          at={worldToScreen(camera, threshold.at)}
        />
      ))}
    </div>
  );
}

function Arrow({ threshold, at }: { readonly threshold: Threshold; readonly at: Point }) {
  const { camera, view } = useCanvas();
  const { to, direction } = threshold;
  const go = (): void => {
    moveTo(camera, camera.fitted(view.current, to.rect, FIT_PADDING), view.current);
  };
  return (
    <Placed at={at}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className={ARROW} aria-label={`Go to ${to.room.name}`} onClick={go}>
            <svg
              className={GLYPH}
              data-direction={direction}
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className={TIP} side="top" sideOffset={8}>
            To {to.room.name}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Placed>
  );
}
