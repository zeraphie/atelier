/**
 * ─ Route ─
 *
 * The tour as a line through the plan: in at the entrance, through
 * each doorway in turn, and past every work on the way, standing a
 * little off its wall to look. Derived from the hang, so it winds as
 * the doorways do. The stops are the works in the order the walk
 * meets them; a room with nothing in it is crossed through its middle.
 * Decision: DECISIONS.md, a route through the rooms.
 */

import type { Point, WorldRect } from "../geometry.js";
import type { HungRoom, HungWork, Plan, Segment } from "./hang.js";

export interface Stop {
  readonly work: HungWork;
  readonly room: HungRoom;
  /** Where in the path the walk stands to look at the work. */
  readonly at: number;
}

export interface Route {
  /** The walk, entrance first, as points in the world. */
  readonly path: readonly Point[];
  readonly stops: readonly Stop[];
}

/** How far off a wall the walk stands to look at a work. */
export const STAND_CM = 90;

/** The walk through `plan`, and where it stops. */
export function routeThrough(plan: Plan, standCm = STAND_CM): Route {
  const path: Point[] = [];
  const stops: Stop[] = [];
  plan.rooms.forEach((room, i) => {
    // The doorways come in the rooms' order, the entrance first.
    const doorway = plan.doorways[i];
    if (doorway !== undefined) {
      path.push(middle(doorway.gap));
    }
    if (room.works.length === 0) {
      path.push(centre(room.rect));
    }
    for (const hung of room.works) {
      path.push(standing(hung, standCm));
      stops.push({ work: hung, room, at: path.length - 1 });
    }
  });
  return { path, stops };
}

// In front of the work, out from its wall into the room.
function standing(hung: HungWork, standCm: number): Point {
  const { rect, wall } = hung;
  const at = centre(rect);
  switch (wall) {
    case "top":
      return { x: at.x, y: rect.bottom + standCm };
    case "bottom":
      return { x: at.x, y: rect.top - standCm };
    case "left":
      return { x: rect.right + standCm, y: at.y };
    case "right":
      return { x: rect.left - standCm, y: at.y };
  }
}

function centre(rect: WorldRect): Point {
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
}

function middle(segment: Segment): Point {
  return { x: (segment.a.x + segment.b.x) / 2, y: (segment.a.y + segment.b.y) / 2 };
}
