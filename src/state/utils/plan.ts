/**
 * ─ The live plan ─
 *
 * The plan as a value of the stores: the shipped rooms and works with
 * the gallery's edits applied, your own pictures hung among them from
 * the collection, hung by the same hang as before, and the route
 * through it. Derived once per change of the edits or the collection
 * and kept until they change again, so a selector returns the same
 * plan for the same inputs and nothing re-renders for a mode or a
 * draft. The canvas subscribes here to rebuild when the plan does.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import { applyEdits } from "../../gallery/edit/edited.js";
import { hangGallery, SPACING, type Plan } from "../../gallery/layout/hang.js";
import { routeThrough, type Route } from "../../gallery/route/route.js";
import { ROOMS, type Cells, type Room } from "../../gallery/works.js";
import { useOwnStore, type OwnStore } from "../own-store.js";
import { useStore, type Store } from "../store.js";

type Pictures = OwnStore["pictures"];

interface Derived {
  readonly rooms: Store["rooms"];
  readonly doorways: Store["doorways"];
  readonly placed: Store["placed"];
  readonly hangings: Store["hangings"];
  readonly pictures: Pictures;
  readonly plan: Plan;
  readonly route: Route;
}

let derived: Derived | undefined;

function derive(state: Store, pictures: Pictures): Derived {
  if (
    derived !== undefined &&
    derived.rooms === state.rooms &&
    derived.doorways === state.doorways &&
    derived.placed === state.placed &&
    derived.hangings === state.hangings &&
    derived.pictures === pictures
  ) {
    return derived;
  }
  const edited = applyEdits(ROOMS, editsOf(state, pictures));
  const plan = hangGallery(edited.rooms, SPACING, {
    placed: edited.placed,
    doorways: edited.doorways,
  });
  derived = {
    rooms: state.rooms,
    doorways: state.doorways,
    placed: state.placed,
    hangings: state.hangings,
    pictures,
    plan,
    route: routeThrough(plan),
  };
  return derived;
}

// What the plan depends on, from the gallery store and the collection.
function editsOf(state: Store, pictures: Pictures) {
  const { rooms, doorways, placed, hangings } = state;
  return { rooms, doorways, placed, hangings, pictures };
}

/** The plan for a state of the store and a collection; the same object while both are the same. */
export function planOf(state: Store, pictures: Pictures = useOwnStore.getState().pictures): Plan {
  return derive(state, pictures).plan;
}

export function routeOf(state: Store, pictures: Pictures = useOwnStore.getState().pictures): Route {
  return derive(state, pictures).route;
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

/**
 * The current plan with a room's cells put in: swapped if the room is there,
 * added at the end if not. A preview of a resize or a draw, derived each time
 * and not kept.
 */
export function planWith(roomId: string, cells: Cells): Plan {
  const edited = applyEdits(ROOMS, editsOf(useStore.getState(), useOwnStore.getState().pictures));
  const rooms: readonly Room[] = edited.rooms.some((room) => room.id === roomId)
    ? edited.rooms.map((room) => (room.id === roomId ? { ...room, ...cells } : room))
    : [...edited.rooms, { id: roomId, name: "", ...cells, works: [], drawn: true }];
  return hangGallery(rooms, SPACING, { placed: edited.placed, doorways: edited.doorways });
}
