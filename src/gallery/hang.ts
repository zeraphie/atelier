/**
 * ─ Hang ─
 *
 * Where everything goes, from the data alone, as a floor plan. Rooms
 * are cells in a grid, each column as wide as its widest room and
 * each row as tall as its tallest, sharing walls; inside a room the
 * works hang on one centre line, evenly spaced, the way a gallery
 * hangs a wall. The rooms' order is the tour, and each pair in turn
 * gets a doorway in the wall they share, with an entrance on the
 * first room's outer wall. World units are centimetres.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import type { Point, WorldRect } from "../geometry.js";
import type { Room, Work } from "./works.js";

export interface Spacing {
  /** Between two works on a line. */
  readonly gapCm: number;
  /** Around a room's works, on every side. */
  readonly paddingCm: number;
  /** Extra room above the works, where the room's name sits. */
  readonly headroomCm: number;
  /** A room is never smaller than this on either side, works or not. */
  readonly leastRoomCm: number;
  /** How thick the walls are drawn. */
  readonly wallCm: number;
  /** How wide a doorway is. */
  readonly doorCm: number;
}

export interface Segment {
  readonly a: Point;
  readonly b: Point;
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

export const SPACING: Spacing = {
  gapCm: 40,
  paddingCm: 60,
  headroomCm: 40,
  leastRoomCm: 240,
  wallCm: 8,
  doorCm: 100,
};

/** Lay the rooms out as a plan, hang their works, and cut the doorways of the tour. */
export function hangGallery(rooms: readonly Room[], spacing: Spacing = SPACING): Plan {
  const columnWidths = extents(
    rooms,
    (room) => room.column,
    (room) => roomWidth(room, spacing)
  );
  const rowHeights = extents(
    rooms,
    (room) => room.row,
    (room) => roomHeight(room, spacing)
  );
  const hung = rooms.map((room) => {
    const left = offset(columnWidths, room.column);
    const top = offset(rowHeights, room.row);
    const rect = {
      left,
      top,
      right: left + (columnWidths[room.column] ?? 0),
      bottom: top + (rowHeights[room.row] ?? 0),
    };
    return { room, rect, works: hangWorks(room, rect, spacing) };
  });
  const doorways = cutDoorways(hung, spacing);
  return {
    rooms: hung,
    walls: wallsOf(hung, doorways, spacing),
    doorways,
    bounds: union(hung.map((h) => h.rect)),
  };
}

// The works of a room on its centre line, centred in it, left to right.
function hangWorks(room: Room, rect: WorldRect, spacing: Spacing): HungWork[] {
  const width = worksWidth(room, spacing);
  const centre = rect.top + spacing.headroomCm + (rect.bottom - rect.top - spacing.headroomCm) / 2;
  let x = rect.left + (rect.right - rect.left - width) / 2;
  return room.works.map((work) => {
    const hungWork = {
      work,
      rect: {
        left: x,
        top: centre - work.heightCm / 2,
        right: x + work.widthCm,
        bottom: centre + work.heightCm / 2,
      },
    };
    x += work.widthCm + spacing.gapCm;
    return hungWork;
  });
}

function worksWidth(room: Room, spacing: Spacing): number {
  const widths = room.works.map((work) => work.widthCm);
  return Math.max(0, widths.reduce((sum, w) => sum + w, 0) + spacing.gapCm * (widths.length - 1));
}

function roomWidth(room: Room, spacing: Spacing): number {
  return Math.max(spacing.leastRoomCm, worksWidth(room, spacing) + 2 * spacing.paddingCm);
}

function roomHeight(room: Room, spacing: Spacing): number {
  const tallest = Math.max(0, ...room.works.map((work) => work.heightCm));
  return Math.max(spacing.leastRoomCm, tallest + 2 * spacing.paddingCm + spacing.headroomCm);
}

// The largest size in each cell of one axis, by index.
function extents(
  rooms: readonly Room[],
  cellOf: (room: Room) => number,
  sizeOf: (room: Room) => number
): number[] {
  const sizes: number[] = [];
  for (const room of rooms) {
    sizes[cellOf(room)] = Math.max(sizes[cellOf(room)] ?? 0, sizeOf(room));
  }
  return Array.from(sizes, (size) => size ?? 0);
}

function offset(sizes: readonly number[], cell: number): number {
  let at = 0;
  for (let i = 0; i < cell; i += 1) {
    at += sizes[i] ?? 0;
  }
  return at;
}

// A doorway between each room and the next in the tour, in the wall they
// share, and the entrance in the first room's outer wall.
function cutDoorways(rooms: readonly HungRoom[], spacing: Spacing): Doorway[] {
  const doorways: Doorway[] = [];
  const first = rooms[0];
  if (first !== undefined) {
    doorways.push({ from: "outside", to: first.room.id, gap: entrance(first, rooms, spacing) });
  }
  for (let i = 1; i < rooms.length; i += 1) {
    const from = rooms[i - 1];
    const to = rooms[i];
    if (from === undefined || to === undefined) {
      continue;
    }
    const shared = sharedWall(from.rect, to.rect);
    if (shared === undefined) {
      throw new Error(
        `the tour goes from "${from.room.id}" to "${to.room.id}", which share no wall`
      );
    }
    doorways.push({ from: from.room.id, to: to.room.id, gap: middle(shared, spacing.doorCm) });
  }
  return doorways;
}

// The stretch of wall two rooms have in common, or none when they do not touch.
function sharedWall(a: WorldRect, b: WorldRect): Segment | undefined {
  const x = a.right === b.left ? a.right : a.left === b.right ? a.left : undefined;
  if (x !== undefined) {
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    return bottom > top ? { a: { x, y: top }, b: { x, y: bottom } } : undefined;
  }
  const y = a.bottom === b.top ? a.bottom : a.top === b.bottom ? a.top : undefined;
  if (y !== undefined) {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    return right > left ? { a: { x: left, y }, b: { x: right, y } } : undefined;
  }
  return undefined;
}

// The first room's outer wall, bottom first, and a doorway in the middle of it.
function entrance(first: HungRoom, rooms: readonly HungRoom[], spacing: Spacing): Segment {
  const others = rooms.filter((hung) => hung !== first).map((hung) => hung.rect);
  const outer = edges(first.rect).find(
    (edge) =>
      !others.some((rect) => sharedWall(first.rect, rect) !== undefined && overlaps(edge, rect))
  );
  return middle(outer ?? edges(first.rect)[0]!, spacing.doorCm);
}

// Whether a room's edge lies on another rect's boundary.
function overlaps(edge: Segment, rect: WorldRect): boolean {
  const isVertical = edge.a.x === edge.b.x;
  if (isVertical) {
    return (
      (edge.a.x === rect.left || edge.a.x === rect.right) &&
      edge.a.y < rect.bottom &&
      edge.b.y > rect.top
    );
  }
  return (
    (edge.a.y === rect.top || edge.a.y === rect.bottom) &&
    edge.a.x < rect.right &&
    edge.b.x > rect.left
  );
}

// The four edges of a room, bottom first: the side an entrance is likeliest on.
function edges(rect: WorldRect): Segment[] {
  return [
    { a: { x: rect.left, y: rect.bottom }, b: { x: rect.right, y: rect.bottom } },
    { a: { x: rect.left, y: rect.top }, b: { x: rect.left, y: rect.bottom } },
    { a: { x: rect.right, y: rect.top }, b: { x: rect.right, y: rect.bottom } },
    { a: { x: rect.left, y: rect.top }, b: { x: rect.right, y: rect.top } },
  ];
}

// A stretch `length` long in the middle of a segment, or the whole of a shorter one.
function middle(segment: Segment, length: number): Segment {
  const dx = segment.b.x - segment.a.x;
  const dy = segment.b.y - segment.a.y;
  const total = Math.hypot(dx, dy);
  const taken = Math.min(length, total);
  const from = (total - taken) / 2 / total;
  const to = (total + taken) / 2 / total;
  return {
    a: { x: segment.a.x + dx * from, y: segment.a.y + dy * from },
    b: { x: segment.a.x + dx * to, y: segment.a.y + dy * to },
  };
}

// Every room's edges once, each with the doorways on it taken out. A wall
// ends in a square cap, so a doorway is cut wider by the wall to show its
// full width between the caps.
function wallsOf(
  rooms: readonly HungRoom[],
  doorways: readonly Doorway[],
  spacing: Spacing
): Segment[] {
  const seen = new Set<string>();
  const walls: Segment[] = [];
  for (const hung of rooms) {
    for (const edge of edges(hung.rect)) {
      const key = `${edge.a.x},${edge.a.y}-${edge.b.x},${edge.b.y}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      let pieces = [edge];
      for (const doorway of doorways) {
        pieces = pieces.flatMap((piece) => cut(piece, widen(doorway.gap, spacing.wallCm)));
      }
      walls.push(...pieces);
    }
  }
  return walls;
}

function widen(gap: Segment, by: number): Segment {
  const dx = Math.sign(gap.b.x - gap.a.x) * (by / 2);
  const dy = Math.sign(gap.b.y - gap.a.y) * (by / 2);
  return { a: { x: gap.a.x - dx, y: gap.a.y - dy }, b: { x: gap.b.x + dx, y: gap.b.y + dy } };
}

// A segment with a gap taken out of it, when the gap lies along it.
function cut(segment: Segment, gap: Segment): Segment[] {
  const isVertical = segment.a.x === segment.b.x;
  const onLine = isVertical
    ? gap.a.x === segment.a.x && gap.b.x === segment.a.x
    : gap.a.y === segment.a.y && gap.b.y === segment.a.y;
  if (!onLine) {
    return [segment];
  }
  const at = (p: Point) => (isVertical ? p.y : p.x);
  const point = (v: number): Point =>
    isVertical ? { x: segment.a.x, y: v } : { x: v, y: segment.a.y };
  const start = Math.min(at(segment.a), at(segment.b));
  const end = Math.max(at(segment.a), at(segment.b));
  const gapStart = Math.max(start, Math.min(at(gap.a), at(gap.b)));
  const gapEnd = Math.min(end, Math.max(at(gap.a), at(gap.b)));
  if (gapEnd <= gapStart) {
    return [segment];
  }
  const pieces: Segment[] = [];
  if (gapStart > start) {
    pieces.push({ a: point(start), b: point(gapStart) });
  }
  if (gapEnd < end) {
    pieces.push({ a: point(gapEnd), b: point(end) });
  }
  return pieces;
}

function union(rects: readonly WorldRect[]): WorldRect {
  return {
    left: Math.min(...rects.map((r) => r.left)),
    top: Math.min(...rects.map((r) => r.top)),
    right: Math.max(...rects.map((r) => r.right)),
    bottom: Math.max(...rects.map((r) => r.bottom)),
  };
}
