/**
 * ─ Snapshot ─
 *
 * What a gallery holds that persists, as one value to hand a peer, and
 * how two of them become one: every stamped record by the later stamp,
 * the reset floor by the later reset with everything before it dropped,
 * and the threads by id, each comment by id with the later edit
 * standing, and the later word on whether a thread is resolved. Pure,
 * and the same whichever side merges, so two screens converge.
 * Decision: DECISIONS.md, slices with actions, latest wins.
 */

import type { Comment, Thread } from "../comments/model.js";
import type { Point } from "../geometry.js";
import type { Edge } from "../gallery/edges.js";
import { roomsAfter, type RoomEdit } from "../state/slices/gallery.js";
import type { Hanging } from "../state/slices/pictures.js";
import { keptAfter, latest, type Stamped } from "../state/utils/stamped.js";

/** The persisted part of a gallery. */
export interface Snapshot {
  readonly threads: readonly Thread[];
  readonly placed: Readonly<Record<string, Stamped<Point>>>;
  readonly hangings: Readonly<Record<string, Stamped<Hanging | null>>>;
  readonly rooms: Readonly<Record<string, RoomEdit>>;
  readonly doorways: Readonly<Record<string, Stamped<Edge | null>>>;
  readonly resetAt: number;
}

/** The snapshot of a gallery's state: its persisted fields and nothing else. */
export function snapshotOf(state: Snapshot): Snapshot {
  const { threads, placed, hangings, rooms, doorways, resetAt } = state;
  return { threads, placed, hangings, rooms, doorways, resetAt };
}

/** `mine` with `theirs` merged in, the later of anything stamped winning and a tie kept as mine. */
export function mergeSnapshot(mine: Snapshot, theirs: Snapshot): Snapshot {
  const resetAt = Math.max(mine.resetAt, theirs.resetAt);
  return {
    threads: mergeThreads(mine.threads, theirs.threads),
    placed: keptAfter(mergeStamped(mine.placed, theirs.placed), resetAt),
    hangings: keptAfter(mergeStamped(mine.hangings, theirs.hangings), resetAt),
    rooms: roomsAfter(mergeRooms(mine.rooms, theirs.rooms), resetAt),
    doorways: keptAfter(mergeStamped(mine.doorways, theirs.doorways), resetAt),
    resetAt,
  };
}

function mergeStamped<T>(
  mine: Readonly<Record<string, Stamped<T>>>,
  theirs: Readonly<Record<string, Stamped<T>>>
): Record<string, Stamped<T>> {
  const merged: Record<string, Stamped<T>> = { ...mine };
  for (const [key, stamped] of Object.entries(theirs)) {
    merged[key] = latest(merged[key], stamped);
  }
  return merged;
}

function mergeRooms(
  mine: Readonly<Record<string, RoomEdit>>,
  theirs: Readonly<Record<string, RoomEdit>>
): Record<string, RoomEdit> {
  const merged: Record<string, RoomEdit> = { ...mine };
  for (const [id, edit] of Object.entries(theirs)) {
    const known = merged[id] ?? {};
    const name = either(known.name, edit.name);
    const cells = either(known.cells, edit.cells);
    const drawn = either(known.drawn, edit.drawn);
    merged[id] = {
      ...(name === undefined ? {} : { name }),
      ...(cells === undefined ? {} : { cells }),
      ...(drawn === undefined ? {} : { drawn }),
    };
  }
  return merged;
}

// The later of two stamped values, either of which may be missing.
function either<T>(mine: Stamped<T> | undefined, theirs: Stamped<T> | undefined) {
  if (theirs === undefined) {
    return mine;
  }
  return latest(mine, theirs);
}

// Threads by id: mine in my order, then theirs I did not have; a thread on
// both sides takes every comment of both and the later word on resolved.
function mergeThreads(mine: readonly Thread[], theirs: readonly Thread[]): Thread[] {
  const merged = new Map(mine.map((thread) => [thread.id, thread]));
  for (const thread of theirs) {
    const known = merged.get(thread.id);
    merged.set(thread.id, known === undefined ? thread : mergeThread(known, thread));
  }
  return [...merged.values()];
}

function mergeThread(mine: Thread, theirs: Thread): Thread {
  const theirsLater = (theirs.resolvedAt ?? 0) > (mine.resolvedAt ?? 0);
  const comments = new Map(mine.comments.map((comment) => [comment.id, comment]));
  for (const comment of theirs.comments) {
    const known = comments.get(comment.id);
    comments.set(comment.id, known === undefined ? comment : laterEdit(known, comment));
  }
  return {
    ...mine,
    comments: [...comments.values()].sort((a, b) => a.createdAt - b.createdAt),
    resolved: theirsLater ? theirs.resolved : mine.resolved,
    ...(theirsLater ? { resolvedAt: theirs.resolvedAt } : {}),
  };
}

// The comment whose text was set later; a tie keeps mine.
function laterEdit(mine: Comment, theirs: Comment): Comment {
  return (theirs.editedAt ?? 0) > (mine.editedAt ?? 0) ? theirs : mine;
}
