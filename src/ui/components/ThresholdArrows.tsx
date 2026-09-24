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
import { useMemo } from "react";
import { FIT_PADDING, moveTo, worldToScreen } from "../../camera/index.js";
import type { Point } from "../../geometry.js";
import { thresholdsOf, type Threshold } from "../../gallery/route/thresholds.js";
import { usePlan } from "../../state/utils/plan.js";
import { ArrowIcon } from "../atoms/icons.js";
import { OnScreen } from "../atoms/OnScreen.js";
import { Tip } from "../atoms/Tip.js";
import { useCameraState, useCanvas } from "../utils/canvas-context.js";

const ARROW =
  "pointer-events-auto flex size-9 items-center justify-center " +
  "rounded-full border-2 border-accent bg-surface text-accent shadow-md " +
  "transition-[scale,background-color,color] hover:scale-110 hover:bg-accent hover:text-accent-ink " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";

export function ThresholdArrows() {
  const camera = useCameraState();
  const plan = usePlan();
  const thresholds = useMemo(() => thresholdsOf(plan), [plan]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {thresholds.map((threshold) => (
        <Arrow
          key={`${threshold.from.room.id}>${threshold.to.room.id}`}
          threshold={threshold}
          at={worldToScreen(camera, threshold.at)}
        />
      ))}
    </div>
  );
}

function Arrow({ threshold, at }: { readonly threshold: Threshold; readonly at: Point }) {
  const { camera, canvasSize } = useCanvas();
  const { to, direction } = threshold;
  const go = (): void => {
    moveTo(camera, camera.fitted(canvasSize.current, to.rect, FIT_PADDING), canvasSize.current);
  };
  return (
    <OnScreen at={at}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className={ARROW} aria-label={`Go to ${to.room.name}`} onClick={go}>
            <ArrowIcon direction={direction} />
          </button>
        </Tooltip.Trigger>
        <Tip>To {to.room.name}</Tip>
      </Tooltip.Root>
    </OnScreen>
  );
}
