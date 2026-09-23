/**
 * ─ Message ─
 *
 * What travels between the peers of a viewing, and the check that a
 * message is one: an action a screen took, named, with its arguments
 * and its time, and only one of the actions a peer may replay. Pure,
 * so a message from the network is judged before anything acts on it.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import type { ActionCall } from "../state/utils/actions.js";

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
