/**
 * ─ Doors ─
 *
 * A doorway put by hand: which two rooms a metre edge stands between,
 * the key their doorway is kept under, and whether their doorway sits
 * on that edge already, so a click on it takes the doorway away and a
 * click on any other edge of the wall puts it there. Pure; the Door
 * tool paces it.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import { edgeSegment, pairKey, type Edge } from "./edges.js";
import type { Doorway, HungRoom, Plan, Segment } from "./hang.js";

/** Two rooms with a wall in common, in the plan's order, and the key their doorway is kept under. */
export interface Pair {
  readonly key: string;
  readonly from: string;
  readonly to: string;
}

/** What a click on an edge would do: put the pair's doorway there, or take it away if it is there. */
export interface DoorAction {
  readonly edge: Edge;
  readonly pair: Pair;
  readonly isThere: boolean;
}

/** The two rooms `edge` stands between, or none when it is not a wall two rooms share. */
export function pairAt(plan: Plan, edge: Edge, unitCm: number): Pair | undefined {
  const segment = edgeSegment(edge, unitCm);
  const beside = plan.rooms.filter((room) => onBoundary(room, segment));
  const [from, to] = beside;
  if (from === undefined || to === undefined || beside.length !== 2) {
    return undefined;
  }
  return { key: pairKey(from.room.id, to.room.id), from: from.room.id, to: to.room.id };
}

/** Whether `doorway` sits on `edge`: its middle within the edge's metre. */
export function doorwayOnEdge(doorway: Doorway, edge: Edge, unitCm: number): boolean {
  const { a, b } = edgeSegment(edge, unitCm);
  const middle = {
    x: (doorway.gap.a.x + doorway.gap.b.x) / 2,
    y: (doorway.gap.a.y + doorway.gap.b.y) / 2,
  };
  if (a.x === b.x) {
    return middle.x === a.x && middle.y >= a.y && middle.y <= b.y;
  }
  return middle.y === a.y && middle.x >= a.x && middle.x <= b.x;
}

/** What a click on `edge` would do, or nothing when the edge is not a wall two rooms share. */
export function doorAt(plan: Plan, edge: Edge, unitCm: number): DoorAction | undefined {
  const pair = pairAt(plan, edge, unitCm);
  if (pair === undefined) {
    return undefined;
  }
  const doorway = plan.doorways.find((d) => d.from === pair.from && d.to === pair.to);
  const isThere = doorway !== undefined && doorwayOnEdge(doorway, edge, unitCm);
  return { edge, pair, isThere };
}

// Whether a grid segment lies along one of the room's walls, within its ends.
function onBoundary(room: HungRoom, segment: Segment): boolean {
  const { rect } = room;
  const { a, b } = segment;
  if (a.x === b.x) {
    return (a.x === rect.left || a.x === rect.right) && a.y >= rect.top && b.y <= rect.bottom;
  }
  return (a.y === rect.top || a.y === rect.bottom) && a.x >= rect.left && b.x <= rect.right;
}
