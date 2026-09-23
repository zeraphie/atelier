/**
 * ─ Edited ─
 *
 * The gallery's data as this gallery has edited it: the shipped rooms
 * with their renamed names and resized cells, the rooms drawn here in
 * the order they were drawn, every moved work's point, every moved
 * doorway's edge, and your own pictures hung here, each a work in the
 * room its point is in. Pure, so a change in the store is a new plan
 * and nothing else.
 * Decision: DECISIONS.md, the wall is curated by default, yours to rearrange here.
 */

import type { Point } from "../geometry.js";
import type { PictureRecord } from "../state/slices/collection.js";
import type { RoomEdit } from "../state/slices/gallery.js";
import type { Hanging } from "../state/slices/pictures.js";
import type { Stamped } from "../state/utils/stamped.js";
import type { Edge } from "./edges.js";
import { rectOf, SPACING } from "./hang.js";
import type { Room, Work } from "./works.js";

/** What the slices hold that the plan depends on. */
export interface Edits {
  readonly rooms: Readonly<Record<string, RoomEdit>>;
  readonly doorways: Readonly<Record<string, Stamped<Edge | null>>>;
  readonly placed: Readonly<Record<string, Stamped<Point>>>;
  /** Your own pictures hung here, by hanging id; null once taken down. */
  readonly hangings?: Readonly<Record<string, Stamped<Hanging | null>>>;
  /** The collection the hangings point into, by picture id. */
  readonly pictures?: Readonly<Record<string, PictureRecord>>;
}

/** What the hang takes: rooms as edited, and the overrides by key. */
export interface Edited {
  readonly rooms: readonly Room[];
  readonly placed: Readonly<Record<string, Point>>;
  readonly doorways: Readonly<Record<string, Edge | null>>;
}

/** `base` with `edits` applied, `unitCm` to a cell of the grid. */
export function applyEdits(
  base: readonly Room[],
  edits: Edits,
  unitCm: number = SPACING.unitCm
): Edited {
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
    .filter(([id, edit]) => edit.drawn?.value === true && !base.some((room) => room.id === id))
    .sort(([, a], [, b]) => (a.drawn?.at ?? 0) - (b.drawn?.at ?? 0))
    .flatMap<Room>(([id, edit]) => {
      const cells = edit.cells?.value;
      if (cells === undefined) {
        return [];
      }
      return [{ id, name: edit.name?.value ?? "Room", ...cells, works: [], drawn: true }];
    });
  const rooms = [...shipped, ...drawn];
  const placed: Record<string, Point> = values(edits.placed);
  // Each hanging still up, of a picture the collection knows, is a work of
  // your own in the room its point is in, placed at that point; a point it
  // was moved to since, by a later stamp, wins over where it was hung.
  const hung = new Map<string, Work[]>();
  for (const { value: hanging, at: hungAt } of Object.values(edits.hangings ?? {})) {
    const record = hanging === null ? undefined : edits.pictures?.[hanging.pictureId];
    if (hanging === null || record === undefined) {
      continue;
    }
    const moved = edits.placed[hanging.id];
    const at = moved !== undefined && moved.at > hungAt ? moved.value : hanging.at;
    const room = rooms.find((candidate) => contains(rectOf(candidate, unitCm), at));
    if (room === undefined) {
      continue;
    }
    placed[hanging.id] = at;
    hung.set(room.id, [...(hung.get(room.id) ?? []), workOf(hanging, record)]);
  }
  return {
    rooms: rooms.map((room) => {
      const works = hung.get(room.id);
      return works === undefined ? room : { ...room, works: [...room.works, ...works] };
    }),
    placed,
    doorways: values(edits.doorways),
  };
}

// A hanging as a work: the record's words, the hanging's width, and the
// height the picture's proportions give it.
function workOf(hanging: Hanging, record: PictureRecord): Work {
  const heightCm = (hanging.widthCm * record.size.height) / record.size.width;
  return {
    id: hanging.id,
    title: record.title,
    artist: record.artist,
    year: record.year,
    medium: record.description,
    widthCm: hanging.widthCm,
    heightCm: Math.round(heightCm * 10) / 10,
    collection: record.credit,
    source: "",
    pictureId: record.id,
  };
}

function contains(rect: { left: number; top: number; right: number; bottom: number }, p: Point) {
  return p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom;
}

function values<T>(map: Readonly<Record<string, Stamped<T>>>): Record<string, T> {
  return Object.fromEntries(Object.entries(map).map(([key, stamped]) => [key, stamped.value]));
}
