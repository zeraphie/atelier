/**
 * ─ Doors ─
 *
 * A doorway put by hand on any metre edge of a wall: between two rooms
 * it is the pair's one doorway, kept under the pair's key; on an outer
 * wall it is a way outside, kept under the room's key with the edge,
 * so a room may have one for every metre of outer wall. Which rooms an
 * edge stands between, the key a click would write, and whether a
 * doorway sits on the edge already, so the click takes it away instead.
 * Pure; the Door tool paces it.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import { edgeKey, edgeOnRect, pairKey, type Edge } from "./edges.js";
import { OUTSIDE, type Doorway, type Plan } from "./hang.js";

/** The two sides of a doorway, in the plan's order, and the key it is kept under. */
export interface Pair {
  readonly key: string;
  readonly from: string;
  readonly to: string;
}

/** What a click on an edge would do: put a doorway there, or take away the one that is there. */
export interface DoorAction {
  readonly edge: Edge;
  readonly pair: Pair;
  readonly isThere: boolean;
}

/** The two rooms `edge` stands between, or none when it is not a wall two rooms share. */
export function pairAt(plan: Plan, edge: Edge, unitCm: number): Pair | undefined {
  const beside = plan.rooms.filter((room) => edgeOnRect(room.rect, edge, unitCm));
  const [from, to] = beside;
  if (from === undefined || to === undefined || beside.length !== 2) {
    return undefined;
  }
  return { key: pairKey(from.room.id, to.room.id), from: from.room.id, to: to.room.id };
}

/** The key a way outside from `roomId` on `edge` is kept under. */
export function outsideKey(roomId: string, edge: Edge): string {
  return `${pairKey(roomId, OUTSIDE)}:${edgeKey(edge)}`;
}

/** Whether `doorway` sits on `edge`: its middle on the edge's line, within the edge's metre. */
export function doorwayOnEdge(doorway: Doorway, edge: Edge, unitCm: number): boolean {
  const x = edge.col * unitCm;
  const y = edge.row * unitCm;
  const middle = {
    x: (doorway.gap.a.x + doorway.gap.b.x) / 2,
    y: (doorway.gap.a.y + doorway.gap.b.y) / 2,
  };
  return edge.side === "east"
    ? middle.x === x + unitCm && middle.y >= y && middle.y <= y + unitCm
    : middle.y === y + unitCm && middle.x >= x && middle.x <= x + unitCm;
}

/** What a click on `edge` would do, or nothing when the edge is on no wall. */
export function doorAt(plan: Plan, edge: Edge, unitCm: number): DoorAction | undefined {
  const pair = pairAt(plan, edge, unitCm);
  if (pair !== undefined) {
    const doorway = plan.doorways.find((d) => d.from === pair.from && d.to === pair.to);
    const isThere = doorway !== undefined && doorwayOnEdge(doorway, edge, unitCm);
    return { edge, pair, isThere };
  }
  // An outer wall: the edge on one room's boundary and no other's.
  const room = plan.rooms.find((candidate) => edgeOnRect(candidate.rect, edge, unitCm));
  if (room === undefined) {
    return undefined;
  }
  const id = room.room.id;
  // The entrance, or a way outside put here before, is taken away under its own key.
  const there = plan.doorways.find(
    (d) =>
      ((d.from === OUTSIDE && d.to === id) || (d.from === id && d.to === OUTSIDE)) &&
      doorwayOnEdge(d, edge, unitCm)
  );
  if (there !== undefined) {
    const key = there.from === OUTSIDE ? pairKey(OUTSIDE, id) : outsideKey(id, edge);
    return { edge, pair: { key, from: there.from, to: there.to }, isThere: true };
  }
  return { edge, pair: { key: outsideKey(id, edge), from: id, to: OUTSIDE }, isThere: false };
}
