/**
 * ─ Foyer plaque ─
 *
 * How to get about, on a plaque in the first room, where the view
 * opens: a museum's visitor panel rather than a toast. Anchored to the
 * room's centre by the camera, at one size on screen like a pin, and
 * shown only while the room is wide enough on screen to hold it, so
 * from the plan it is gone, and by then it has been read. It takes no
 * pointer events, so the canvas under it still pans. Visitors found
 * the double tap by luck, which is what put it here.
 * Decision: DECISIONS.md, arriving: the Foyer, a plaque, and an arrow at each threshold.
 */

import { Fragment } from "react";
import { worldToScreen } from "../camera/index.js";
import { PLAN } from "../gallery/plan.js";
import { useCameraState } from "./canvas-context.js";
import { Placed } from "./Placed.js";

// The room must be at least this wide on screen for the plaque to show.
const ROOM_LEAST_PX = 240;

const CONTROLS: readonly (readonly [string, string])[] = [
  ["Move", "drag, or scroll"],
  ["Zoom", "pinch, or Ctrl + scroll"],
  ["See a work", "double-click or double-tap it, and it fills the view"],
  ["Comment", "press C, or right-click, then choose the spot"],
  ["Tour", "the Tour button walks the works; the arrows on the floor lead room to room"],
];

export function FoyerPlaque() {
  const camera = useCameraState();
  const first = PLAN.rooms[0];
  if (first === undefined) {
    return null;
  }
  const { rect } = first;
  const isShown = (rect.right - rect.left) * camera.zoom >= ROOM_LEAST_PX;
  const centre = { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Placed at={worldToScreen(camera, centre)}>
        <section
          aria-label="How to get about"
          aria-hidden={!isShown}
          data-shown={isShown}
          className="w-72 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-surface/95 p-4 shadow-md transition-opacity data-[shown=false]:opacity-0"
        >
          <h2 className="mb-2 font-display text-sm text-ink">Welcome</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-sans text-sm leading-snug">
            {CONTROLS.map(([what, how]) => (
              <Fragment key={what}>
                <dt className="text-ink">{what}</dt>
                <dd className="text-muted">{how}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
      </Placed>
    </div>
  );
}
