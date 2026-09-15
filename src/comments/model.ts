/**
 * ─ Comment model ─
 *
 * A thread is pinned to a point in the world, in centimetres, and
 * holds its comments in order: the first is the one that opened it,
 * the rest are replies. A thread is open or resolved. Nothing here
 * knows about a screen, a room or a person beyond a name.
 * Decision: DECISIONS.md, threads: a root and its replies.
 */

import type { Point } from "../geometry.js";

export interface Comment {
  readonly id: string;
  readonly author: string;
  readonly text: string;
  /** Milliseconds since the epoch. */
  readonly createdAt: number;
  /** Set once the text has been changed. */
  readonly editedAt?: number;
}

export interface Thread {
  readonly id: string;
  /** Where the pin sits, in world units. */
  readonly at: Point;
  /** The first comment opened the thread; the rest are replies, in order. */
  readonly comments: readonly Comment[];
  readonly resolved: boolean;
}

export interface CommentsState {
  readonly threads: readonly Thread[];
}

export const EMPTY: CommentsState = { threads: [] };
