/**
 * ─ Cursors ─
 *
 * Where the others' pointers are, in the world: a point per peer for
 * as long as it is over its canvas, gone when it leaves it or the
 * viewing. Your own is said to the centimetre, the world's unit, so a
 * pointer at rest says nothing new.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { Point } from "../geometry.js";
import { perPeer } from "./per-peer.js";

export type Cursors = Readonly<Record<string, Point>>;

const peers = perPeer<Point>();

/** The peers' pointers in the world, by peer id; only those over their canvas. */
export const cursors = peers.store;

/** A peer's pointer is at `at`, or, with null, has left its canvas. */
export const placeCursor = peers.place;

/** A peer's pointer is gone, as when the peer is. */
export const dropCursor = peers.drop;

/** No pointers at all, as on leaving a viewing. */
export const clearCursors = peers.clear;
