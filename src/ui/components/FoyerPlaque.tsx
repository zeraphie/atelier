/**
 * ─ Foyer plaque ─
 *
 * How to get about, on a plaque in the first room, where the view
 * opens: the receptionist, telling a visitor the way around. Anchored
 * to the room's centre by the camera; at one size on screen like a
 * pin while the view is near, and shrinking with the room from
 * further out, so it is always there and never covers the plan. It
 * takes no pointer events, so the canvas under it still pans.
 * Visitors found the double tap by luck, which is what put it here.
 * Decision: DECISIONS.md, arriving: the Foyer, a plaque, and an arrow at each threshold.
 */

import { Fragment } from "react";
import { worldToScreen } from "../../camera/index.js";
import { PLAN } from "../../gallery/plan.js";
import { Card } from "../atoms/Card.js";
import { Placed } from "../atoms/Placed.js";
import { useCameraState } from "../utils/canvas-context.js";

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
  const centre = { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
  // Life size and above, the plaque is a panel; below, it shrinks with the room.
  const scale = Math.min(1, camera.zoom);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Placed at={worldToScreen(camera, centre)}>
        <Card
          aria-label="How to get about"
          className="w-72 max-w-[calc(100vw-2rem)] p-4"
          style={{ transform: `scale(${scale})` }}
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
        </Card>
      </Placed>
    </div>
  );
}
