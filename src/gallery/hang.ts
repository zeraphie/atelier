/**
 * ─ Hang ─
 *
 * Where everything goes, from the data alone, as a floor plan. A room
 * is a cell on a grid of metres, spanning as many as its data says,
 * sharing walls with its neighbours. The rooms' order is the tour:
 * each pair in turn gets a doorway in the wall they share, a third of
 * the way along from the end farthest from the doorway before it, so
 * the route winds and no door looks straight through to the next; a
 * pair that shares no wall gets none. A room drawn in the gallery is
 * outside the tour: it opens onto every room it meets, one doorway per
 * pair, centred on the wall they share. A doorway put by hand holds
 * whatever the rules said: between two rooms that share a wall, or on
 * an outer wall as a way outside, keyed by its edge; and one taken away
 * is not cut, the entrance included. Works hang on the walls, the
 * wall facing the entry first, so the first thing seen through a threshold
 * is a work on the far wall, and the doorways' stretches stay clear; a
 * work that names its wall hangs there. The gallery's edits come in
 * beside the data: a work placed by hand sits at its point on no wall,
 * and a doorway moved to an edge sits there. A work a room has no wall
 * for sits at the room's centre rather than failing the build. World
 * units are centimetres.
 * Decision: DECISIONS.md, layout from data: the hang.
 */

import type { Point, WorldRect } from "../geometry.js";
import { edgeOnRect, edgeOnWall, edgeSegment, pairKey, type Edge } from "./edges.js";
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

export interface Segment {
  readonly a: Point;
  readonly b: Point;
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

/** The name of the world beyond the walls, as the far side of an entrance or a way outside. */
export const OUTSIDE = "outside";

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

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

// ── Doorways ──

function cutDoorways(
  rooms: readonly Room[],
  rects: readonly WorldRect[],
  spacing: Spacing,
  chosen: Readonly<Record<string, Edge | null>>
): Doorway[] {
  const placed = rooms.map((room, i) => ({ room, rect: rects[i]! }));
  // The tour is the shipped rooms: the first has the entrance, and each opens
  // onto the next where they share a wall.
  const shipped = placed.filter(({ room }) => room.drawn !== true);
  const first = shipped[0];
  if (first === undefined) {
    return [];
  }
  const next = shipped[1]?.rect;
  const towards =
    next === undefined
      ? centre(first.rect)
      : centre(sharedWall(first.rect, next) ?? edges(next).top);
  const doorways: Doorway[] = [];
  // Where the last doorway was, which the next winds away from; with no
  // doorway into a room, the room's own centre stands in.
  let before = centre(first.rect);
  // The entrance: by the rule, or on an outer edge chosen by hand, or none.
  const entranceEdge = chosen[pairKey(OUTSIDE, first.room.id)];
  if (entranceEdge !== null) {
    const entrance =
      entranceEdge !== undefined && isOuterEdge(first.rect, entranceEdge, rects, spacing.unitCm)
        ? doorOnEdge(entranceEdge, spacing)
        : doorNear(outerWall(first.rect, rects), towards, spacing);
    doorways.push({ from: OUTSIDE, to: first.room.id, gap: entrance });
    before = centre(entrance);
  }
  for (let i = 1; i < shipped.length; i += 1) {
    const from = shipped[i - 1]!;
    const to = shipped[i]!;
    const shared = sharedWall(from.rect, to.rect);
    if (shared === undefined) {
      before = centre(to.rect);
      continue;
    }
    const edge = chosen[pairKey(from.room.id, to.room.id)];
    if (edge === null) {
      // Taken away by hand: the route goes on from the room itself.
      before = centre(to.rect);
      continue;
    }
    const gap =
      edge !== undefined && edgeOnWall(shared, edge, spacing.unitCm)
        ? doorOnEdge(edge, spacing)
        : doorFar(shared, before, spacing);
    doorways.push({ from: from.room.id, to: to.room.id, gap });
    before = centre(gap);
  }
  // A drawn room opens onto every room it meets, once per pair, the doorway
  // centred on the wall they share unless one was chosen. The pair runs from
  // the earlier room in the order to the later, which is the way on.
  for (const [i, drawn] of placed.entries()) {
    if (drawn.room.drawn !== true) {
      continue;
    }
    for (const [j, other] of placed.entries()) {
      const shared = j === i ? undefined : sharedWall(drawn.rect, other.rect);
      if (shared === undefined) {
        continue;
      }
      const from = placed[Math.min(i, j)]!.room.id;
      const to = placed[Math.max(i, j)]!.room.id;
      if (doorways.some((doorway) => doorway.from === from && doorway.to === to)) {
        continue;
      }
      const edge = chosen[pairKey(from, to)];
      if (edge === null) {
        continue;
      }
      const gap =
        edge !== undefined && edgeOnWall(shared, edge, spacing.unitCm)
          ? doorOnEdge(edge, spacing)
          : doorCentred(shared, spacing);
      doorways.push({ from, to, gap });
    }
  }
  // A doorway put by hand: between two rooms the rules gave none, on the
  // edge chosen when it lies on a wall they share; or a way outside from a
  // room, keyed by its edge, while that edge is an outer wall of the room.
  for (const [key, edge] of Object.entries(chosen)) {
    if (edge === null || doorways.some((doorway) => pairKey(doorway.from, doorway.to) === key)) {
      continue;
    }
    const [fromId, toId] = key.split(">");
    const from = placed.find(({ room }) => room.id === fromId);
    if (from === undefined || toId === undefined) {
      continue;
    }
    if (toId.startsWith(OUTSIDE)) {
      if (isOuterEdge(from.rect, edge, rects, spacing.unitCm)) {
        doorways.push({ from: from.room.id, to: OUTSIDE, gap: doorOnEdge(edge, spacing) });
      }
      continue;
    }
    const to = placed.find(({ room }) => room.id === toId);
    if (to === undefined) {
      continue;
    }
    const shared = sharedWall(from.rect, to.rect);
    if (shared !== undefined && edgeOnWall(shared, edge, spacing.unitCm)) {
      doorways.push({ from: from.room.id, to: to.room.id, gap: doorOnEdge(edge, spacing) });
    }
  }
  return doorways;
}

// Whether an edge lies on `rect`'s boundary and on no other room's: an outer wall.
function isOuterEdge(
  rect: WorldRect,
  edge: Edge,
  rects: readonly WorldRect[],
  unitCm: number
): boolean {
  return (
    edgeOnRect(rect, edge, unitCm) &&
    !rects.some((other) => other !== rect && edgeOnRect(other, edge, unitCm))
  );
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

// The first room's wall with nothing on the other side, the bottom preferred.
function outerWall(rect: WorldRect, rects: readonly WorldRect[]): Segment {
  const others = rects.filter((other) => other !== rect);
  const sides = edges(rect);
  const order: Side[] = ["bottom", "left", "right", "top"];
  const outer = order.find((side) => !others.some((other) => touches(sides[side], other)));
  return sides[outer ?? "bottom"];
}

// Whether an edge runs along another rect's boundary.
function touches(edge: Segment, rect: WorldRect): boolean {
  if (edge.a.x === edge.b.x) {
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

// A doorway a third of the way along `wall` from the end farthest from `point`.
function doorFar(wall: Segment, point: Point, spacing: Spacing): Segment {
  const nearA = distance(wall.a, point) <= distance(wall.b, point);
  return doorAt(wall, nearA ? "b" : "a", spacing);
}

// A doorway a third of the way along `wall` from the end nearest to `point`.
function doorNear(wall: Segment, point: Point, spacing: Spacing): Segment {
  const nearA = distance(wall.a, point) <= distance(wall.b, point);
  return doorAt(wall, nearA ? "a" : "b", spacing);
}

// The doorway a third of the way along a wall from one end: off centre, so a
// door never looks straight through the room, and clear of the corner.
function doorAt(wall: Segment, end: "a" | "b", spacing: Spacing): Segment {
  const total = distance(wall.a, wall.b);
  const width = Math.min(spacing.doorCm, total);
  const third = Math.min(Math.max(total / 3, width / 2), total - width / 2);
  const at = end === "a" ? third : total - third;
  return { a: along(wall, at - width / 2), b: along(wall, at + width / 2) };
}

// The doorway centred on a metre edge someone chose.
function doorOnEdge(edge: Edge, spacing: Spacing): Segment {
  return doorCentred(edgeSegment(edge, spacing.unitCm), spacing);
}

// The doorway in the middle of a wall: a drawn room's, with no route to wind.
function doorCentred(wall: Segment, spacing: Spacing): Segment {
  const total = distance(wall.a, wall.b);
  const width = Math.min(spacing.doorCm, total);
  return { a: along(wall, (total - width) / 2), b: along(wall, (total + width) / 2) };
}

// ── Works on walls ──

// Works that name a wall hang there. The rest take the walls in order: the
// one facing the entry, then the two beside it, then the entry wall itself.
// On each, the longest stretch no doorway breaks, and the works centred on
// it. A work placed by hand skips the walls and sits at its point; one no
// wall has room for sits at the room's centre.
function hangWorks(
  room: Room,
  rect: WorldRect,
  entry: Side,
  doorways: readonly Doorway[],
  spacing: Spacing,
  placed: Readonly<Record<string, Point>>
): HungWork[] {
  const sides = edges(rect);
  const order: Side[] = [OPPOSITE[entry], ...beside(entry), entry];
  const hung: HungWork[] = [];
  const unhung: Work[] = [];
  const toHang = room.works.filter((work) => placed[work.id] === undefined);
  const stretchOf = (side: Side): Segment => {
    const gaps = doorways.map((d) => d.gap).filter((gap) => onWall(sides[side], gap));
    return shrink(longestFree(sides[side], gaps), spacing.endMarginCm);
  };
  const measureOf = (side: Side) => (side === "top" || side === "bottom" ? "width" : "height");
  for (const side of order) {
    const named = toHang.filter((work) => work.wall === side);
    if (named.length === 0) {
      continue;
    }
    const stretch = stretchOf(side);
    const taken = takeThatFit(
      named,
      measureOf(side),
      distance(stretch.a, stretch.b),
      spacing.gapCm
    );
    unhung.push(...named.slice(taken.length));
    hung.push(...place(taken, side, stretch, rect, spacing));
  }
  let remaining = toHang.filter((work) => work.wall === undefined);
  for (const side of order) {
    if (remaining.length === 0) {
      break;
    }
    if (hung.some((h) => h.wall === side)) {
      continue;
    }
    const stretch = stretchOf(side);
    const taken = takeThatFit(
      remaining,
      measureOf(side),
      distance(stretch.a, stretch.b),
      spacing.gapCm
    );
    remaining = remaining.slice(taken.length);
    hung.push(...place(taken, side, stretch, rect, spacing));
  }
  unhung.push(...remaining);
  const middle = centre(rect);
  return [
    // In the order a walk meets them: wall by wall, the far wall first.
    ...order.flatMap((side) => hung.filter((h) => h.wall === side)),
    ...unhung.map((work) => centredOn(work, middle)),
    ...room.works
      .filter((work) => placed[work.id] !== undefined)
      .map((work) => centredOn(work, placed[work.id]!)),
  ];
}

// A work with its centre on a point, on no wall.
function centredOn(work: Work, point: Point): HungWork {
  return {
    work,
    rect: {
      left: point.x - work.widthCm / 2,
      top: point.y - work.heightCm / 2,
      right: point.x + work.widthCm / 2,
      bottom: point.y + work.heightCm / 2,
    },
  };
}

function beside(side: Side): Side[] {
  return side === "top" || side === "bottom" ? ["left", "right"] : ["top", "bottom"];
}

// As many works as fit along `length`, in order, with gaps between.
function takeThatFit(
  works: readonly Work[],
  measure: "width" | "height",
  length: number,
  gap: number
): Work[] {
  const taken: Work[] = [];
  let used = 0;
  for (const work of works) {
    const size = measure === "width" ? work.widthCm : work.heightCm;
    const next = used + (taken.length > 0 ? gap : 0) + size;
    if (next > length) {
      break;
    }
    taken.push(work);
    used = next;
  }
  return taken;
}

// The works centred along their stretch of wall, standing off it a little.
function place(
  works: readonly Work[],
  side: Side,
  stretch: Segment,
  rect: WorldRect,
  spacing: Spacing
): HungWork[] {
  const isHorizontal = side === "top" || side === "bottom";
  const sizes = works.map((work) => (isHorizontal ? work.widthCm : work.heightCm));
  const total =
    sizes.reduce((sum, s) => sum + s, 0) + spacing.gapCm * Math.max(0, works.length - 1);
  const from = isHorizontal
    ? Math.min(stretch.a.x, stretch.b.x)
    : Math.min(stretch.a.y, stretch.b.y);
  let at = from + (distance(stretch.a, stretch.b) - total) / 2;
  return works.map((work) => {
    let hungRect: WorldRect;
    if (side === "top") {
      const top = rect.top + spacing.headroomCm + spacing.standoffCm;
      hungRect = { left: at, top, right: at + work.widthCm, bottom: top + work.heightCm };
    } else if (side === "bottom") {
      const bottom = rect.bottom - spacing.standoffCm;
      hungRect = { left: at, top: bottom - work.heightCm, right: at + work.widthCm, bottom };
    } else if (side === "left") {
      const left = rect.left + spacing.standoffCm;
      hungRect = { left, top: at, right: left + work.widthCm, bottom: at + work.heightCm };
    } else {
      const right = rect.right - spacing.standoffCm;
      hungRect = { left: right - work.widthCm, top: at, right, bottom: at + work.heightCm };
    }
    at += (isHorizontal ? work.widthCm : work.heightCm) + spacing.gapCm;
    return { work, rect: hungRect, wall: side };
  });
}

// ── Walls ──

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

// ── Finding ──

/** The work under a world point, if any. */
export function workAt(plan: Plan, point: Point): HungWork | undefined {
  for (const room of plan.rooms) {
    const hit = room.works.find((hung) => contains(hung.rect, point));
    if (hit !== undefined) {
      return hit;
    }
  }
  return undefined;
}

/** The room under a world point, if any. */
export function roomAt(plan: Plan, point: Point): HungRoom | undefined {
  return plan.rooms.find((room) => contains(room.rect, point));
}

function contains(rect: WorldRect, point: Point): boolean {
  return (
    point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
  );
}

// ── Geometry ──

function edges(rect: WorldRect): Record<Side, Segment> {
  return {
    top: { a: { x: rect.left, y: rect.top }, b: { x: rect.right, y: rect.top } },
    right: { a: { x: rect.right, y: rect.top }, b: { x: rect.right, y: rect.bottom } },
    bottom: { a: { x: rect.left, y: rect.bottom }, b: { x: rect.right, y: rect.bottom } },
    left: { a: { x: rect.left, y: rect.top }, b: { x: rect.left, y: rect.bottom } },
  };
}

// Which of a rect's walls a gap lies on.
function sideOf(rect: WorldRect, gap: Segment): Side {
  const sides = edges(rect);
  const found = (Object.keys(sides) as Side[]).find((side) => onWall(sides[side], gap));
  if (found === undefined) {
    throw new Error("a doorway lies on none of its room's walls");
  }
  return found;
}

function onWall(wall: Segment, gap: Segment): boolean {
  if (wall.a.x === wall.b.x) {
    return (
      gap.a.x === wall.a.x && gap.b.x === wall.a.x && gap.a.y >= wall.a.y && gap.b.y <= wall.b.y
    );
  }
  return gap.a.y === wall.a.y && gap.b.y === wall.a.y && gap.a.x >= wall.a.x && gap.b.x <= wall.b.x;
}

// The longest piece of a wall between its doorways.
function longestFree(wall: Segment, gaps: readonly Segment[]): Segment {
  let pieces = [wall];
  for (const gap of gaps) {
    pieces = pieces.flatMap((piece) => cut(piece, gap));
  }
  const longest = pieces.reduce<Segment | undefined>(
    (best, piece) =>
      best === undefined || distance(piece.a, piece.b) > distance(best.a, best.b) ? piece : best,
    undefined
  );
  // A wall that is all doorway has no stretch: its midpoint, and nothing fits.
  return longest ?? { a: centre(wall), b: centre(wall) };
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

// A segment `by` shorter at both ends, or its midpoint when too short.
function shrink(segment: Segment, by: number): Segment {
  const total = distance(segment.a, segment.b);
  if (total <= 2 * by) {
    const mid = along(segment, total / 2);
    return { a: mid, b: mid };
  }
  return { a: along(segment, by), b: along(segment, total - by) };
}

function widen(gap: Segment, by: number): Segment {
  const dx = Math.sign(gap.b.x - gap.a.x) * (by / 2);
  const dy = Math.sign(gap.b.y - gap.a.y) * (by / 2);
  return { a: { x: gap.a.x - dx, y: gap.a.y - dy }, b: { x: gap.b.x + dx, y: gap.b.y + dy } };
}

function along(segment: Segment, at: number): Point {
  const total = distance(segment.a, segment.b);
  const t = total === 0 ? 0 : at / total;
  return {
    x: segment.a.x + (segment.b.x - segment.a.x) * t,
    y: segment.a.y + (segment.b.y - segment.a.y) * t,
  };
}

function centre(shape: Segment | WorldRect): Point {
  if ("a" in shape) {
    return { x: (shape.a.x + shape.b.x) / 2, y: (shape.a.y + shape.b.y) / 2 };
  }
  return { x: (shape.left + shape.right) / 2, y: (shape.top + shape.bottom) / 2 };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function union(rects: readonly WorldRect[]): WorldRect {
  return {
    left: Math.min(...rects.map((r) => r.left)),
    top: Math.min(...rects.map((r) => r.top)),
    right: Math.max(...rects.map((r) => r.right)),
    bottom: Math.max(...rects.map((r) => r.bottom)),
  };
}
