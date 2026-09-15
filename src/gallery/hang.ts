/**
 * ─ Hang ─
 *
 * Where everything goes, from the data alone. Inside a room the works
 * hang on one centre line, left to right, evenly spaced, the way a
 * gallery hangs a wall; the room is as big as its works plus a margin
 * and headroom for its name. Rooms sit in a grid of cells, each
 * column as wide as its widest room and each row as tall as its
 * tallest, with a corridor between. World units are centimetres.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import type { WorldRect } from "../geometry.js";
import type { Room, Work } from "./works.js";

export interface Spacing {
  /** Between two works on a line. */
  readonly gapCm: number;
  /** Around a room's works, on every side. */
  readonly paddingCm: number;
  /** Extra room above the works, where the room's name sits. */
  readonly headroomCm: number;
  /** Between rooms. */
  readonly corridorCm: number;
}

export interface HungWork {
  readonly work: Work;
  readonly rect: WorldRect;
}

export interface HungRoom {
  readonly room: Room;
  readonly rect: WorldRect;
  readonly works: readonly HungWork[];
}

export interface Hang {
  readonly rooms: readonly HungRoom[];
  /** Everything, for the view to fit. */
  readonly bounds: WorldRect;
}

export const SPACING: Spacing = { gapCm: 40, paddingCm: 60, headroomCm: 40, corridorCm: 150 };

/** Hang every room's works and lay the rooms out on the floor plan. */
export function hangGallery(rooms: readonly Room[], spacing: Spacing = SPACING): Hang {
  const local = rooms.map((room) => hangRoom(room, spacing));
  const columnWidths = extents(
    local,
    (hung) => hung.room.column,
    (r) => r.right - r.left
  );
  const rowHeights = extents(
    local,
    (hung) => hung.room.row,
    (r) => r.bottom - r.top
  );
  const placed = local.map((hung) => {
    const dx = offset(columnWidths, hung.room.column, spacing.corridorCm) - hung.rect.left;
    const dy = offset(rowHeights, hung.room.row, spacing.corridorCm) - hung.rect.top;
    return {
      room: hung.room,
      rect: shift(hung.rect, dx, dy),
      works: hung.works.map((w) => ({ work: w.work, rect: shift(w.rect, dx, dy) })),
    };
  });
  return { rooms: placed, bounds: union(placed.map((hung) => hung.rect)) };
}

// One room about its own origin: the centre line is y = 0, the first work
// starts at x = 0, and the room's rectangle wraps them with the margins.
function hangRoom(room: Room, spacing: Spacing): HungRoom {
  let x = 0;
  const works = room.works.map((work) => {
    const rect = {
      left: x,
      top: -work.heightCm / 2,
      right: x + work.widthCm,
      bottom: work.heightCm / 2,
    };
    x += work.widthCm + spacing.gapCm;
    return { work, rect };
  });
  const tallest = Math.max(0, ...room.works.map((work) => work.heightCm));
  const width = Math.max(0, x - spacing.gapCm);
  return {
    room,
    rect: {
      left: -spacing.paddingCm,
      top: -tallest / 2 - spacing.paddingCm - spacing.headroomCm,
      right: width + spacing.paddingCm,
      bottom: tallest / 2 + spacing.paddingCm,
    },
    works,
  };
}

// The widest (or tallest) room in each column (or row), by index.
function extents(
  rooms: readonly HungRoom[],
  cellOf: (hung: HungRoom) => number,
  sizeOf: (rect: WorldRect) => number
): number[] {
  const sizes: number[] = [];
  for (const hung of rooms) {
    const cell = cellOf(hung);
    sizes[cell] = Math.max(sizes[cell] ?? 0, sizeOf(hung.rect));
  }
  return sizes.map((size) => size ?? 0);
}

// Where a cell starts: every earlier cell's extent, each followed by a corridor.
function offset(sizes: readonly number[], cell: number, corridorCm: number): number {
  let at = 0;
  for (let i = 0; i < cell; i += 1) {
    at += (sizes[i] ?? 0) + corridorCm;
  }
  return at;
}

function shift(rect: WorldRect, dx: number, dy: number): WorldRect {
  return {
    left: rect.left + dx,
    top: rect.top + dy,
    right: rect.right + dx,
    bottom: rect.bottom + dy,
  };
}

function union(rects: readonly WorldRect[]): WorldRect {
  return {
    left: Math.min(...rects.map((r) => r.left)),
    top: Math.min(...rects.map((r) => r.top)),
    right: Math.max(...rects.map((r) => r.right)),
    bottom: Math.max(...rects.map((r) => r.bottom)),
  };
}
