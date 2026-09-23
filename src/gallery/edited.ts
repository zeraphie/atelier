/**
 * ─ Edited ─
 *
 * The gallery's data as this gallery has edited it: the shipped rooms
 * with their renamed names and resized cells, the rooms drawn here in
 * the order they were drawn, every moved work's point, and every
 * moved doorway's edge. Pure, so a change in the store is a new plan
 * and nothing else.
 * Decision: DECISIONS.md, the wall is curated by default, yours to rearrange here.
 */

import type { Point } from "../geometry.js";
import type { Stamped } from "../state/stamped.js";
import type { Edge } from "./edges.js";
import type { RoomEdit } from "./gallery-slice.js";
import type { Room } from "./works.js";

/** What the slices hold that the plan depends on. */
export interface Edits {
  readonly rooms: Readonly<Record<string, RoomEdit>>;
  readonly doorways: Readonly<Record<string, Stamped<Edge>>>;
  readonly placed: Readonly<Record<string, Stamped<Point>>>;
}

/** What the hang takes: rooms as edited, and the overrides by key. */
export interface Edited {
  readonly rooms: readonly Room[];
  readonly placed: Readonly<Record<string, Point>>;
  readonly doorways: Readonly<Record<string, Edge>>;
}

/** `base` with `edits` applied. */
export function applyEdits(base: readonly Room[], edits: Edits): Edited {
  const shipped = base.map((room) => {
    const edit = edits.rooms[room.id];
    if (edit === undefined) {
      return room;
    }
    return {
      ...room,
      name: edit.name?.value ?? room.name,
      ...edit.cells?.value,
    };
  });
  const drawn = Object.entries(edits.rooms)
    .filter(([id, edit]) => edit.drawn !== undefined && !base.some((room) => room.id === id))
    .sort(([, a], [, b]) => (a.drawn?.at ?? 0) - (b.drawn?.at ?? 0))
    .flatMap(([id, edit]) => {
      const cells = edit.cells?.value;
      if (cells === undefined) {
        return [];
      }
      return [{ id, name: edit.name?.value ?? "Room", ...cells, works: [] }];
    });
  return {
    rooms: [...shipped, ...drawn],
    placed: values(edits.placed),
    doorways: values(edits.doorways),
  };
}

function values<T>(map: Readonly<Record<string, Stamped<T>>>): Record<string, T> {
  return Object.fromEntries(Object.entries(map).map(([key, stamped]) => [key, stamped.value]));
}
