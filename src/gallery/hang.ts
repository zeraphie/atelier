/**
 * ─ Hang ─
 *
 * Where everything goes, from the data alone, as a floor plan. A room
 * is a cell on a grid of metres, spanning as many as its data says,
 * sharing walls with its neighbours; the doorways are cut by the rules
 * in doorways.ts, the works hung by those in hanging.ts, and the walls
 * drawn with the doorways taken out. The gallery's edits come in
 * beside the data. World units are centimetres.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import { union, type Point, type Segment, type WorldRect } from "../geometry.js";
import { cutDoorways } from "./doorways.js";
import type { Edge } from "./edges.js";
import { hangWorks } from "./hanging.js";
import { cut, edges, sideOf, widen } from "./wall-math.js";
import type { Cells, Room, Side, Work } from "./works.js";

export interface Spacing {
  /** One cell of the plan's grid. */
  readonly unitCm: number;
  /** Between two works on a wall. */
  readonly gapCm: number;
  /** How far a hung work stands off its wall. */
  readonly standoffCm: number;
  /** How far the works on a wall keep from its ends. */
  readonly endMarginCm: number;
  /** Extra room under the top wall, where the room's name sits. */
  readonly headroomCm: number;
  /** How thick the walls are drawn. */
  readonly wallCm: number;
  /** How wide a doorway is: half a cell. */
  readonly doorCm: number;
}

export type { Side } from "./works.js";

export interface HungWork {
  readonly work: Work;
  readonly rect: WorldRect;
  /** The wall it hangs on; none for a work placed by hand, or one its room had no wall for. */
  readonly wall?: Side;
}

export interface HungRoom {
  readonly room: Room;
  readonly rect: WorldRect;
  readonly works: readonly HungWork[];
}

export interface Doorway {
  /** The room the tour comes from; "outside" for the entrance. */
  readonly from: string;
  readonly to: string;
  /** The opening, as the stretch of wall that is not there. */
  readonly gap: Segment;
}

export interface Plan {
  readonly rooms: readonly HungRoom[];
  /** The walls to draw, doorways already cut out of them. */
  readonly walls: readonly Segment[];
  readonly doorways: readonly Doorway[];
  /** Everything, for the view to fit. */
  readonly bounds: WorldRect;
}

/** The gallery's edits the hang honours: works placed by hand, and doorways moved to an edge. */
export interface HangEdits {
  /** By work id: the point the work's centre sits on, instead of a wall. */
  readonly placed?: Readonly<Record<string, Point>>;
  /** By pair key: the metre edge the doorway between two rooms sits on, or null for none. */
  readonly doorways?: Readonly<Record<string, Edge | null>>;
}

export const SPACING: Spacing = {
  unitCm: 100,
  gapCm: 40,
  standoffCm: 15,
  endMarginCm: 25,
  headroomCm: 30,
  wallCm: 8,
  doorCm: 50,
};

/** Lay the rooms out as a plan, cut the doorways of the tour, and hang the works on the walls. */
export function hangGallery(
  rooms: readonly Room[],
  spacing: Spacing = SPACING,
  edits: HangEdits = {}
): Plan {
  const rects = rooms.map((room) => rectOf(room, spacing.unitCm));
  const doorways = cutDoorways(rooms, rects, spacing, edits.doorways ?? {});
  const hung = rooms.map((room, i) => {
    const rect = rects[i]!;
    const entry = doorways.find((d) => d.to === room.id);
    const entrySide = entry === undefined ? "bottom" : sideOf(rect, entry.gap);
    const onWalls = doorways.filter((d) => d.to === room.id || d.from === room.id);
    return {
      room,
      rect,
      works: hangWorks(room, rect, entrySide, onWalls, spacing, edits.placed ?? {}),
    };
  });
  return {
    rooms: hung,
    walls: wallsOf(rects, doorways, spacing),
    doorways,
    bounds: union(rects),
  };
}

/** The rect of a room's cells on the grid, `unitCm` to a cell. */
export function rectOf(cells: Cells, unitCm: number): WorldRect {
  return {
    left: cells.column * unitCm,
    top: cells.row * unitCm,
    right: (cells.column + cells.columns) * unitCm,
    bottom: (cells.row + cells.rows) * unitCm,
  };
}

// Every room's edges with the doorways on them taken out, and no piece twice:
// two rooms of unequal size share a wall as two different edges, and the same
// doorway cuts the same piece from each. A wall ends in a square cap, so a
// doorway is cut wider by the wall to show its full width between the caps.
function wallsOf(
  rects: readonly WorldRect[],
  doorways: readonly Doorway[],
  spacing: Spacing
): Segment[] {
  const seen = new Set<string>();
  const walls: Segment[] = [];
  for (const rect of rects) {
    for (const edge of Object.values(edges(rect))) {
      let pieces = [edge];
      for (const doorway of doorways) {
        pieces = pieces.flatMap((piece) => cut(piece, widen(doorway.gap, spacing.wallCm)));
      }
      for (const piece of pieces) {
        const key = `${piece.a.x},${piece.a.y}-${piece.b.x},${piece.b.y}`;
        if (!seen.has(key)) {
          seen.add(key);
          walls.push(piece);
        }
      }
    }
  }
  return walls;
}
