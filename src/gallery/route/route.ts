/**
 * ─ Route ─
 *
 * The tour as the works in the order a walk through the plan meets
 * them: room by room in the rooms' order, which is the order the
 * doorways are cut, and wall by wall within a room as the hang orders
 * them, the wall facing the entry first.
 * Decision: DECISIONS.md, a route through the rooms.
 */

import type { HungRoom, HungWork, Plan } from "../layout/hang.js";

export interface Stop {
  readonly work: HungWork;
  readonly room: HungRoom;
}

export interface Route {
  readonly stops: readonly Stop[];
}

/** The works of `plan` in the order the tour visits them. */
export function routeThrough(plan: Plan): Route {
  return {
    stops: plan.rooms.flatMap((room) => room.works.map((work) => ({ work, room }))),
  };
}
