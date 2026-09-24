/**
 * ─ Derived plan ─
 *
 * The plan from the gallery's edits and the collection, kept until
 * either changes: a memo by the identity of its five inputs, so a
 * selector returns the same plan for the same inputs and nothing
 * re-renders for a mode or a draft. Pure: the stores hand their state
 * in, and a preview with a room's cells put in is derived the same way
 * and not kept.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import { applyEdits } from "../../gallery/edit/edited.js";
import { hangGallery, SPACING, type Plan } from "../../gallery/layout/hang.js";
import { routeThrough, type Route } from "../../gallery/route/route.js";
import { ROOMS, type Cells, type Room } from "../../gallery/works.js";
import type { PictureRecord } from "../slices/collection.js";
import type { GallerySlice } from "../slices/gallery.js";
import type { PicturesSlice } from "../slices/pictures.js";

/** What the plan is made from: the gallery's edits, and the collection the hangings point into. */
export interface PlanInputs {
  readonly rooms: GallerySlice["rooms"];
  readonly doorways: GallerySlice["doorways"];
  readonly placed: PicturesSlice["placed"];
  readonly hangings: PicturesSlice["hangings"];
  readonly pictures: Readonly<Record<string, PictureRecord>>;
}

/** The plan and the route through it, the same objects while their inputs are the same. */
export class PlanMemo {
  private last:
    | { readonly inputs: PlanInputs; readonly plan: Plan; readonly route: Route }
    | undefined;

  of(inputs: PlanInputs): { readonly plan: Plan; readonly route: Route } {
    const { last } = this;
    if (last !== undefined && sameInputs(last.inputs, inputs)) {
      return last;
    }
    const edited = applyEdits(ROOMS, inputs);
    const plan = hangGallery(edited.rooms, SPACING, {
      placed: edited.placed,
      doorways: edited.doorways,
    });
    this.last = { inputs, plan, route: routeThrough(plan) };
    return this.last;
  }
}

/**
 * The plan with a room's cells put in: swapped if the room is there, added
 * at the end as a drawn room if not. A preview of a resize or a draw.
 */
export function planWithRoom(inputs: PlanInputs, roomId: string, cells: Cells): Plan {
  const edited = applyEdits(ROOMS, inputs);
  const rooms: readonly Room[] = edited.rooms.some((room) => room.id === roomId)
    ? edited.rooms.map((room) => (room.id === roomId ? { ...room, ...cells } : room))
    : [...edited.rooms, { id: roomId, name: "", ...cells, works: [], drawn: true }];
  return hangGallery(rooms, SPACING, { placed: edited.placed, doorways: edited.doorways });
}

function sameInputs(a: PlanInputs, b: PlanInputs): boolean {
  return (
    a.rooms === b.rooms &&
    a.doorways === b.doorways &&
    a.placed === b.placed &&
    a.hangings === b.hangings &&
    a.pictures === b.pictures
  );
}
