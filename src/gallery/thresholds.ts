/**
 * ─ Thresholds ─
 *
 * An arrow at each doorway of the tour, standing in the room it leads
 * out of and pointing through to the next: the way on, for someone
 * who would rather follow than find. The entrance has none, since
 * nobody stands outside. Derived from the plan alone.
 * Decision: DECISIONS.md, arriving: the Foyer, a plaque, and an arrow at each threshold.
 */

import type { Point } from "../geometry.js";
import type { HungRoom, Plan } from "./hang.js";

export type Direction = "up" | "right" | "down" | "left";

export interface Threshold {
  readonly from: HungRoom;
  readonly to: HungRoom;
  /** Where the arrow stands, in world units: inside `from`, short of the doorway. */
  readonly at: Point;
  /** The way it points: through the doorway, into `to`. */
  readonly direction: Direction;
}

/** How far the arrow stands back from its doorway, in centimetres. */
export const STAND_BACK_CM = 60;

// One step back from a doorway into the room it leads out of, for each way through.
const BACK: Record<Direction, Point> = {
  up: { x: 0, y: 1 },
  right: { x: -1, y: 0 },
  down: { x: 0, y: -1 },
  left: { x: 1, y: 0 },
};

/** An arrow for every doorway between two rooms of `plan`, in the tour's order. */
export function thresholdsOf(plan: Plan): Threshold[] {
  const byId = new Map(plan.rooms.map((room) => [room.room.id, room]));
  const thresholds: Threshold[] = [];
  for (const { from, to, gap } of plan.doorways) {
    const fromRoom = byId.get(from);
    const toRoom = byId.get(to);
    if (fromRoom === undefined || toRoom === undefined) {
      continue;
    }
    const middle = { x: (gap.a.x + gap.b.x) / 2, y: (gap.a.y + gap.b.y) / 2 };
    const direction = wayInto(toRoom, middle);
    const back = BACK[direction];
    thresholds.push({
      from: fromRoom,
      to: toRoom,
      at: { x: middle.x + back.x * STAND_BACK_CM, y: middle.y + back.y * STAND_BACK_CM },
      direction,
    });
  }
  return thresholds;
}

// Which way a doorway leads into `room`: one on its left wall leads right, and so on.
function wayInto(room: HungRoom, doorway: Point): Direction {
  const { rect } = room;
  if (doorway.x === rect.left) {
    return "right";
  }
  if (doorway.x === rect.right) {
    return "left";
  }
  return doorway.y === rect.top ? "down" : "up";
}
