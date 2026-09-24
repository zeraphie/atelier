/**
 * ─ The live plan ─
 *
 * The plan as a value of the stores: the shipped rooms and works with
 * the gallery's edits applied, your own pictures hung among them from
 * the collection, and the route through it, derived by the memo in
 * derive-plan.ts from what the two stores hold. The canvas subscribes
 * here to rebuild when the plan does.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import type { Plan } from "../../gallery/layout/hang.js";
import type { Route } from "../../gallery/route/route.js";
import type { Cells } from "../../gallery/works.js";
import { useOwnStore, type OwnStore } from "../own-store.js";
import { useStore, type Store } from "../store.js";
import { PlanMemo, planWithRoom, type PlanInputs } from "./derive-plan.js";

type Pictures = OwnStore["pictures"];

const memo = new PlanMemo();

// What the plan depends on, from the gallery store and the collection.
function inputsOf(state: Store, pictures: Pictures): PlanInputs {
  const { rooms, doorways, placed, hangings } = state;
  return { rooms, doorways, placed, hangings, pictures };
}

/** The plan for a state of the store and a collection; the same object while both are the same. */
export function planOf(state: Store, pictures: Pictures = useOwnStore.getState().pictures): Plan {
  return memo.of(inputsOf(state, pictures)).plan;
}

export function routeOf(state: Store, pictures: Pictures = useOwnStore.getState().pictures): Route {
  return memo.of(inputsOf(state, pictures)).route;
}

/** The plan, re-rendering only when the edits or the collection change it. */
export function usePlan(): Plan {
  const pictures = useOwnStore((own) => own.pictures);
  return useStore((state) => planOf(state, pictures));
}

/** The plan as it stands now, for code outside React. */
export function currentPlan(): Plan {
  return planOf(useStore.getState());
}

/** The route as it stands now, for code outside React. */
export function currentRoute(): Route {
  return routeOf(useStore.getState());
}

/** Hear of every new plan, from either store; returns the unsubscribe function. */
export function onPlanChange(listener: (plan: Plan) => void): () => void {
  let last = currentPlan();
  const check = (): void => {
    const next = currentPlan();
    if (next !== last) {
      last = next;
      listener(next);
    }
  };
  const stopGallery = useStore.subscribe(check);
  const stopOwn = useOwnStore.subscribe(check);
  return () => {
    stopGallery();
    stopOwn();
  };
}

/** The current plan with a room's cells put in, swapped or added: a preview of a resize or a draw. */
export function planWith(roomId: string, cells: Cells): Plan {
  return planWithRoom(
    inputsOf(useStore.getState(), useOwnStore.getState().pictures),
    roomId,
    cells
  );
}
