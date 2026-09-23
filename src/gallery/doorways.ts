/**
 * ─ Doorways ─
 *
 * Where the doorways are cut. The rooms' order is the tour: each pair
 * in turn gets a doorway in the wall they share, a third of the way
 * along from the end farthest from the doorway before it, so the route
 * winds and no door looks straight through to the next; a pair that
 * shares no wall gets none. A room drawn in the gallery is outside the
 * tour: it opens onto every room it meets, one doorway per pair,
 * centred on the wall they share. A doorway put by hand holds whatever
 * the rules said: between two rooms that share a wall, or on an outer
 * wall as a way outside, keyed by its edge; and one taken away is not
 * cut, the entrance included. Every door sits in the middle of one
 * metre edge of the grid, as a click puts one.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import { along, centre, distance, type Point, type Segment, type WorldRect } from "../geometry.js";
import { edgeOnRect, edgeOnWall, edgeSegment, pairKey, type Edge } from "./edges.js";
import type { Doorway, Spacing } from "./hang.js";
import { edges } from "./wall-math.js";
import type { Room, Side } from "./works.js";

/** The name of the world beyond the walls, as the far side of an entrance or a way outside. */
export const OUTSIDE = "outside";

/** The doorways of the rooms laid out as `rects`: the tour's, the drawn rooms', and the ones chosen by hand. */
export function cutDoorways(
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
  return doorThirdAlong(wall, nearA ? "b" : "a", spacing);
}

// A doorway a third of the way along `wall` from the end nearest to `point`.
function doorNear(wall: Segment, point: Point, spacing: Spacing): Segment {
  const nearA = distance(wall.a, point) <= distance(wall.b, point);
  return doorThirdAlong(wall, nearA ? "a" : "b", spacing);
}

// The doorway a third of the way along a wall from one end: off centre, so a
// door never looks straight through the room, and clear of the corner.
function doorThirdAlong(wall: Segment, end: "a" | "b", spacing: Spacing): Segment {
  const total = distance(wall.a, wall.b);
  return doorInMetreAt(wall, end === "a" ? total / 3 : total - total / 3, spacing, end);
}

// The doorway in the metre of `wall` that holds the point `at` along it. A
// point on a line between two metres takes the metre `towards` the end the
// door was measured from, so it stays off centre the way the rule meant.
function doorInMetreAt(wall: Segment, at: number, spacing: Spacing, towards: "a" | "b"): Segment {
  const total = distance(wall.a, wall.b);
  const metres = Math.max(1, Math.ceil(total / spacing.unitCm));
  const held =
    towards === "a" ? Math.ceil(at / spacing.unitCm) - 1 : Math.floor(at / spacing.unitCm);
  const metre = Math.min(Math.max(0, held), metres - 1);
  // A wall shorter than a metre, which the grid never makes, takes its middle.
  const middle = total < spacing.unitCm ? total / 2 : metre * spacing.unitCm + spacing.unitCm / 2;
  const width = Math.min(spacing.doorCm, total);
  return { a: along(wall, middle - width / 2), b: along(wall, middle + width / 2) };
}

// The doorway centred on a metre edge someone chose.
function doorOnEdge(edge: Edge, spacing: Spacing): Segment {
  return doorCentred(edgeSegment(edge, spacing.unitCm), spacing);
}

// The doorway in the middle metre of a wall: a drawn room's, with no route to wind.
function doorCentred(wall: Segment, spacing: Spacing): Segment {
  return doorInMetreAt(wall, distance(wall.a, wall.b) / 2, spacing, "b");
}
