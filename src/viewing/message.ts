/**
 * ─ Message ─
 *
 * What travels between the peers of a viewing, and the checks that a
 * message is one: an action a screen took, named, with its arguments
 * and its time, and only one of the actions a peer may replay; a
 * snapshot of a gallery for a peer who just arrived; a picture's record
 * sent ahead of its bytes, and what rides beside the bytes; and where a
 * screen's pointer is, or that it has gone. Pure,
 * so a message from the network is judged before anything acts on it.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { Point } from "../geometry.js";
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

/** A picture's record, sent ahead of its bytes, and whose it is. */
export interface PictureMessage {
  readonly kind: "picture";
  readonly record: PictureRecord;
  /** The name of the screen it came from. */
  readonly by: string;
}

/** What rides beside a picture's bytes: which picture they are. */
export interface BytesMetadata {
  readonly kind: "bytes";
  readonly id: string;
}

/** Whether `metadata` says whose bytes these are. */
export function isBytesMetadata(metadata: unknown): metadata is BytesMetadata {
  if (typeof metadata !== "object" || metadata === null) {
    return false;
  }
  const { kind, id } = metadata as { kind?: unknown; id?: unknown };
  return kind === "bytes" && typeof id === "string";
}

/** Whether `data` is a picture message with a record worth keeping. */
export function isPictureMessage(data: unknown): data is PictureMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const { kind, record, by } = data as { kind?: unknown; record?: unknown; by?: unknown };
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

/** A screen saying who it is, on arrival and whenever its name changes: its name, and its browser's id. */
export interface HelloMessage {
  readonly kind: "hello";
  readonly name: string;
  readonly user: string;
  /** The colour, by swatch id. */
  readonly color: string;
}

/** Whether `data` is a hello with a name. */
export function isHelloMessage(data: unknown): data is HelloMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const { kind, name, user, color } = data as {
    kind?: unknown;
    name?: unknown;
    user?: unknown;
    color?: unknown;
  };
  return (
    kind === "hello" &&
    typeof name === "string" &&
    typeof user === "string" &&
    typeof color === "string"
  );
}

/** Where a screen's pointer is in the world, or, with null, that it has left the canvas. */
export interface CursorMessage {
  readonly kind: "cursor";
  readonly at: Point | null;
}

/** Whether `data` is a cursor message with a whole point, or none. */
export function isCursorMessage(data: unknown): data is CursorMessage {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const { kind, at } = data as { kind?: unknown; at?: unknown };
  return kind === "cursor" && (at === null || isPoint(at));
}

function isPoint(value: unknown): value is Point {
  return isRecord(value) && Number.isFinite(value["x"]) && Number.isFinite(value["y"]);
}
