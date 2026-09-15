/**
 * ─ Comment list ─
 *
 * The threads as a list reads them: the open ones, the resolved ones
 * or all, grouped by the room their pin is in, in the order the rooms
 * are walked. A pin outside every room is listed last under its own
 * heading rather than lost. Pure, so the grouping is tested against a
 * plan and never against a screen.
 * Decision: DECISIONS.md, finding a comment: the list, the map and the jump.
 */

import { roomAt, type Plan } from "../gallery/hang.js";
import type { Thread } from "./model.js";

export type ListFilter = "open" | "resolved" | "all";

export interface ThreadGroup {
  readonly id: string;
  readonly name: string;
  readonly threads: readonly Thread[];
}

/** The group for pins that lie in no room. */
export const OUTSIDE = { id: "outside", name: "Outside the rooms" } as const;

/** The threads `filter` keeps: by resolved state, or every one. */
export function filterThreads(threads: readonly Thread[], filter: ListFilter): readonly Thread[] {
  if (filter === "all") {
    return threads;
  }
  return threads.filter((thread) => thread.resolved === (filter === "resolved"));
}

/** The threads by room in the plan's order, then those outside every room; empty groups left out. */
export function groupByRoom(plan: Plan, threads: readonly Thread[]): ThreadGroup[] {
  const byRoom = new Map<string, Thread[]>();
  for (const thread of threads) {
    const id = roomAt(plan, thread.at)?.room.id ?? OUTSIDE.id;
    const group = byRoom.get(id);
    if (group === undefined) {
      byRoom.set(id, [thread]);
    } else {
      group.push(thread);
    }
  }
  const rooms = plan.rooms.map(({ room }) => ({ id: room.id, name: room.name }));
  return [...rooms, OUTSIDE]
    .map((group) => ({ ...group, threads: byRoom.get(group.id) ?? [] }))
    .filter((group) => group.threads.length > 0);
}
