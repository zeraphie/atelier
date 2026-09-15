/**
 * ─ Targets ─
 *
 * What is under a point of the plan, as the interface answers it: a
 * work first, then the room it is in, else the plan as a whole. The
 * double tap fills the view with whichever it finds, and the hover
 * shows the same one, so what lights up is what a double tap would do.
 */

import type { Point } from "../geometry.js";
import { roomAt, workAt, type HungRoom, type HungWork, type Plan } from "./hang.js";

export type Target =
  | { readonly kind: "work"; readonly work: HungWork }
  | { readonly kind: "room"; readonly room: HungRoom }
  | { readonly kind: "plan" };

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
