/**
 * ─ Room ─
 *
 * A shared room, joined by id: the gallery store switches to the room's
 * own key, the room is joined in the background, and from then on every
 * action this screen takes is sent to the peers and every action a peer
 * takes is replayed here by name, marked remote so it is not told again.
 * Leaving unbinds, leaves the room and switches the store back to the
 * solo gallery. Joining the room already joined is nothing, so
 * StrictMode's double mount joins once; a leave during a join cancels
 * it, and the store switches in order whatever the timing.
 * Decision: DECISIONS.md, a room is opt-in by link and siloed.
 */

import { keyForRoom, switchGallery, useStore } from "../state/store.js";
import { onAction, type ActionCall } from "../state/utils/actions.js";
import { connect, type Transport } from "./transport.js";

/** What travels between peers: an action one screen took, for the others to replay. */
export interface ActionMessage {
  readonly kind: "action";
  readonly call: ActionCall;
}

// The actions a peer may replay here: every slice action that takes its time last.
const SHARED = new Set([
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

interface Joined {
  readonly id: string;
  transport: Transport | undefined;
  stopTelling: () => void;
  isLeft: boolean;
}

let current: Joined | undefined;
// Switches of the gallery's key run one after another, so a leave that
// follows a join always lands after it.
let switching: Promise<void> = Promise.resolve();

function switchTo(key: string): Promise<void> {
  switching = switching.then(() => switchGallery(key));
  return switching;
}

/** Join the room `id`, leaving any other first; joining the room already joined is nothing. */
export async function joinRoom(id: string): Promise<void> {
  if (current?.id === id) {
    return;
  }
  await leaveRoom();
  const joined: Joined = { id, transport: undefined, stopTelling: () => {}, isLeft: false };
  current = joined;
  await switchTo(keyForRoom(id));
  if (joined.isLeft) {
    return;
  }
  useStore.getState().enteredRoom(id);
  let transport: Transport;
  try {
    transport = await connect(id);
  } catch (error: unknown) {
    reportError(error);
    return;
  }
  if (joined.isLeft) {
    transport.leave();
    return;
  }
  joined.transport = transport;
  transport.onMessage((data) => replay(data));
  transport.onJoin((peerId) => useStore.getState().peerJoined(peerId));
  transport.onLeave((peerId) => useStore.getState().peerLeft(peerId));
  joined.stopTelling = onAction((call) => {
    const message: ActionMessage = { kind: "action", call };
    transport.send(message);
  });
}

/** Leave the room, if in one, and go back to the solo gallery. */
export async function leaveRoom(): Promise<void> {
  const joined = current;
  if (joined === undefined) {
    return;
  }
  current = undefined;
  joined.isLeft = true;
  joined.stopTelling();
  joined.transport?.leave();
  useStore.getState().leftRoom();
  await switchTo(keyForRoom(undefined));
}

/** The room joined, for the interface and the tests. */
export function currentRoomId(): string | undefined {
  return current?.id;
}

/** The peers the transport itself knows of, for a look under the hood. */
export function currentPeers(): readonly string[] {
  return current?.transport?.peers() ?? [];
}

// A peer's action, replayed by name with its own time and marked remote.
function replay(data: unknown): void {
  if (!isActionMessage(data)) {
    return;
  }
  const { action, args, at } = data.call;
  // Every shared action is a function of the store taking its arguments then its time.
  const state = useStore.getState() as unknown as Record<string, unknown>;
  const act = state[action];
  if (typeof act === "function") {
    (act as (...parameters: unknown[]) => void).call(state, ...args, { at, remote: true });
  }
}

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
