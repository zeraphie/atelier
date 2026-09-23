/**
 * ─ The live plan ─
 *
 * The plan as a value of the store: the shipped rooms and works with
 * the gallery's edits applied, hung by the same hang as before, and
 * the route through it. Derived once per change of the edits and kept
 * until they change again, so a selector returns the same plan for the
 * same edits and nothing re-renders for a mode or a draft. The canvas
 * subscribes here to rebuild when the plan does.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import { applyEdits } from "../gallery/edited.js";
import { hangGallery, SPACING, type Plan } from "../gallery/hang.js";
import { routeThrough, type Route } from "../gallery/route.js";
import { ROOMS, type Cells } from "../gallery/works.js";
import { useStore, type Store } from "./store.js";

interface Derived {
  readonly rooms: Store["rooms"];
  readonly doorways: Store["doorways"];
  readonly placed: Store["placed"];
  readonly plan: Plan;
  readonly route: Route;
}

let derived: Derived | undefined;

function derive(state: Store): Derived {
  if (
    derived !== undefined &&
    derived.rooms === state.rooms &&
    derived.doorways === state.doorways &&
    derived.placed === state.placed
  ) {
    return derived;
  }
  const edited = applyEdits(ROOMS, state);
  const plan = hangGallery(edited.rooms, SPACING, {
    placed: edited.placed,
    doorways: edited.doorways,
  });
  derived = {
    rooms: state.rooms,
    doorways: state.doorways,
    placed: state.placed,
    plan,
    route: routeThrough(plan),
  };
  return derived;
}

/** The plan for a state of the store; the same object while the edits are the same. */
export function planOf(state: Store): Plan {
  return derive(state).plan;
}

export function routeOf(state: Store): Route {
  return derive(state).route;
}

/** The plan, re-rendering only when the edits change it. */
export function usePlan(): Plan {
  return useStore(planOf);
}

export function currentPlan(): Plan {
  return planOf(useStore.getState());
}

export function currentRoute(): Route {
  return routeOf(useStore.getState());
}

/** Hear of every new plan; returns the unsubscribe function. */
export function onPlanChange(listener: (plan: Plan) => void): () => void {
  let last = currentPlan();
  return useStore.subscribe((state) => {
    const next = planOf(state);
    if (next !== last) {
      last = next;
      listener(next);
    }
  });
}

/** The current plan with one room's cells swapped: a preview of a resize, derived each time and not kept. */
export function planWith(roomId: string, cells: Cells): Plan {
  const edited = applyEdits(ROOMS, useStore.getState());
  const rooms = edited.rooms.map((room) => (room.id === roomId ? { ...room, ...cells } : room));
  return hangGallery(rooms, SPACING, { placed: edited.placed, doorways: edited.doorways });
}
