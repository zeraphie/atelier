/**
 * ─ Targets ─
 *
 * What is under a point of the plan: the work there, the room there,
 * and, as the interface answers it, a work first, then the room it is
 * in, else the plan as a whole. The double tap fills the view with
 * whichever it finds, and the hover shows the same one, so what lights
 * up is what a double tap would do.
 * Decision: DECISIONS.md, levels of detail by zoom.
 */

import { contains, type Point } from "../geometry.js";
import type { HungRoom, HungWork, Plan } from "./hang.js";

export type Target =
  | { readonly kind: "work"; readonly work: HungWork }
  | { readonly kind: "room"; readonly room: HungRoom }
  | { readonly kind: "plan" };

/** The work under a world point, if any. */
export function workAt(plan: Plan, point: Point): HungWork | undefined {
  for (const room of plan.rooms) {
    const hit = room.works.find((hung) => contains(hung.rect, point));
    if (hit !== undefined) {
      return hit;
    }
  }
  return undefined;
}

/** The room under a world point, if any. */
export function roomAt(plan: Plan, point: Point): HungRoom | undefined {
  return plan.rooms.find((room) => contains(room.rect, point));
}

/** What a double tap at `point` fills the view with: a work, else its room, else the whole plan. */
export function targetAt(plan: Plan, point: Point): Target {
  const work = workAt(plan, point);
  if (work !== undefined) {
    return { kind: "work", work };
  }
  const room = roomAt(plan, point);
  if (room !== undefined) {
    return { kind: "room", room };
  }
  return { kind: "plan" };
}
