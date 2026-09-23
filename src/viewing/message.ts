/**
 * ─ Message ─
 *
 * What travels between the peers of a viewing, and the checks that a
 * message is one: an action a screen took, named, with its arguments
 * and its time, and only one of the actions a peer may replay; a
 * snapshot of a gallery for a peer who just arrived; and what rides
 * beside a picture's bytes. Pure,
 * so a message from the network is judged before anything acts on it.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import type { PictureRecord } from "../state/slices/collection.js";
import type { ActionCall } from "../state/utils/actions.js";
import type { Snapshot } from "./snapshot.js";

/** An action one screen took, for the others to replay. */
export interface ActionMessage {
  readonly kind: "action";
  readonly call: ActionCall;
}

/** The actions a peer may replay here: every slice action that takes its time last. */
export const SHARED: ReadonlySet<string> = new Set([
  "putThread",
  "putComment",
  "setText",
  "setResolved",
  "moveWork",
  "hang",
  "takeDown",
  "renameRoom",
  "resizeRoom",
  "drawRoom",
  "removeRoom",
  "moveDoor",
  "removeDoor",
  "reset",
]);

/** Whether `data` is an action message naming a shared action. */
export function isActionMessage(data: unknown): data is ActionMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const { kind, call } = data as { kind?: unknown; call?: unknown };
  if (kind !== "action" || typeof call !== "object" || call === null) {
    return false;
  }
  const { action, args, at } = call as { action?: unknown; args?: unknown; at?: unknown };
  return (
    typeof action === "string" &&
    SHARED.has(action) &&
    Array.isArray(args) &&
    typeof at === "number"
  );
}

/** A gallery's persisted state, handed to a peer who just arrived, to merge in. */
export interface SnapshotMessage {
  readonly kind: "snapshot";
  readonly state: Snapshot;
}

/** Whether `data` is a snapshot message with every persisted field in place. */
export function isSnapshotMessage(data: unknown): data is SnapshotMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const { kind, state } = data as { kind?: unknown; state?: unknown };
  if (kind !== "snapshot" || typeof state !== "object" || state === null) {
    return false;
  }
  const s = state as Record<string, unknown>;
  return (
    Array.isArray(s["threads"]) &&
    isRecord(s["placed"]) &&
    isRecord(s["hangings"]) &&
    isRecord(s["rooms"]) &&
    isRecord(s["doorways"]) &&
    typeof s["resetAt"] === "number"
  );
}

/** What rides beside a picture's bytes: its record, and whose it is. */
export interface PictureMetadata {
  readonly kind: "picture";
  readonly record: PictureRecord;
  /** The name of the screen it came from. */
  readonly by: string;
}

/** Whether `metadata` names a picture with a record worth keeping. */
export function isPictureMetadata(metadata: unknown): metadata is PictureMetadata {
  if (typeof metadata !== "object" || metadata === null) {
    return false;
  }
  const { kind, record, by } = metadata as { kind?: unknown; record?: unknown; by?: unknown };
  if (kind !== "picture" || typeof by !== "string" || !isRecord(record)) {
    return false;
  }
  const size = record["size"];
  return (
    typeof record["id"] === "string" &&
    typeof record["title"] === "string" &&
    typeof record["widthCm"] === "number" &&
    typeof record["color"] === "string" &&
    isRecord(size) &&
    typeof size["width"] === "number" &&
    typeof size["height"] === "number"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
