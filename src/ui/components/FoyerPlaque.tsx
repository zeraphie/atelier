/**
 * ─ Foyer plaque ─
 *
 * How to get about, on a plaque in the first room, where the view
 * opens: the receptionist, telling a visitor the way around. It is
 * laid on the room's floor like the desk, so it fits the room at every
 * zoom and reads up close. It takes no pointer events, so the canvas
 * under it still pans. Visitors found the double tap by luck, which is
 * what put it here.
 * Decision: DECISIONS.md, arriving: the Foyer, a plaque, and an arrow at each threshold.
 */

import { Fragment } from "react";
import { usePlan } from "../../state/utils/plan.js";
import { OnFloor } from "../molecules/OnFloor.js";
import { useCameraState } from "../utils/canvas-context.js";

// The plaque's size and place in the room, in centimetres: right of the
// arrow by the doorway, under the room's name, clear of the entrance.
const WIDTH_CM = 190;
const INSET_LEFT_CM = 90;
const INSET_TOP_CM = 90;

const CONTROLS: readonly (readonly [string, string])[] = [
  ["Move", "drag, or scroll"],
  ["Zoom", "pinch, or Ctrl + scroll"],
  ["See a work", "double-click or double-tap it"],
  ["Comment", "press C, or right-click"],
  ["Edit", "press E, or the pen"],
  ["Tour", "the Tour button, or the floor arrows"],
];

export function FoyerPlaque() {
  const camera = useCameraState();
  const first = usePlan().rooms[0];
  if (first === undefined) {
    return null;
  }
  const { rect } = first;
  return (
    <OnFloor
      camera={camera}
      at={{ x: rect.left + INSET_LEFT_CM, y: rect.top + INSET_TOP_CM }}
      widthCm={WIDTH_CM}
      aria-label="How to get about"
      className="pointer-events-none p-3"
    >
      <h2 className="mb-1.5 font-display text-xs text-ink">Welcome</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 font-sans text-[11px] leading-4">
        {CONTROLS.map(([what, how]) => (
          <Fragment key={what}>
            <dt className="text-ink">{what}</dt>
            <dd className="text-muted">{how}</dd>
          </Fragment>
        ))}
      </dl>
    </OnFloor>
  );
}
