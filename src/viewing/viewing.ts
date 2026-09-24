/**
 * ─ Viewing ─
 *
 * A shared viewing, joined by its code: the gallery store switches to
 * the viewing's own key, the viewing is joined in the background, and
 * from then on every action this screen takes is sent to the peers and
 * every action a peer takes is replayed here by name, marked remote so
 * it is not told again. A peer arriving is handed the gallery whole
 * and the pictures hung in it. Presence goes through presence.ts and
 * pictures through pictures.ts; this is the join, the hello and the
 * replay. Joining the viewing already joined is nothing, so
 * StrictMode's double mount joins once; a leave during a join cancels
 * it, and the store switches in order whatever the timing.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { useOwnStore } from "../state/own-store.js";
import { absorbSnapshot, keyForViewing, switchGallery, useStore } from "../state/store.js";
import { onAction } from "../state/utils/actions.js";
import { swatchIdFor } from "./identity/color.js";
import {
  isActionMessage,
  isHelloMessage,
  isSnapshotMessage,
  type ActionMessage,
  type HelloMessage,
  type SnapshotMessage,
} from "./message.js";
import { isHanging, receivePicture, sendPicture } from "./pictures.js";
import {
  bindPresence,
  clearPresence,
  dropPresence,
  receivePresence,
  sayPresenceAgain,
} from "./presence/presence.js";
import { snapshotOf } from "./snapshot.js";
import { connect, type Transport } from "./transport.js";

interface Joined {
  readonly code: string;
  transport: Transport | undefined;
  stopTelling: () => void;
  stopNaming: () => void;
  isLeft: boolean;
  /** Resolves once the viewing's saved state is switched to and the transport is bound or given up. */
  ready: Promise<void>;
}

let current: Joined | undefined;

// Switches of the gallery's key run one after another, so a leave that
// follows a join always lands after it.
let switching: Promise<void> = Promise.resolve();

function switchTo(key: string): Promise<void> {
  switching = switching.then(() => switchGallery(key));
  return switching;
}

/** Join the viewing `code`, leaving any other first; joining the one being joined shares its wait. */
export function joinViewing(code: string): Promise<void> {
  if (current?.code === code) {
    return current.ready;
  }
  const previous = current;
  const joined: Joined = {
    code,
    transport: undefined,
    stopTelling: () => {},
    stopNaming: () => {},
    isLeft: false,
    ready: Promise.resolve(),
  };
  current = joined;
  joined.ready = join(joined, previous);
  return joined.ready;
}

// The join itself: the one before left, the store switched to the viewing's
// key, the viewing entered, and the transport bound once it is up.
async function join(joined: Joined, previous: Joined | undefined): Promise<void> {
  if (previous !== undefined) {
    await leave(previous);
  }
  await switchTo(keyForViewing(joined.code));
  if (joined.isLeft) {
    return;
  }
  useStore.getState().enteredViewing(joined.code);
  useOwnStore.getState().noteViewing(joined.code);
  let transport: Transport;
  try {
    transport = await connect(joined.code);
  } catch (error: unknown) {
    reportError(error);
    return;
  }
  if (joined.isLeft) {
    transport.leave().catch(reportError);
    return;
  }
  bind(joined, transport);
}

// Everything the transport does for the viewing, once connected.
function bind(joined: Joined, transport: Transport): void {
  joined.transport = transport;
  bindPresence(transport);
  transport.onMessage((data, from, metadata) => {
    receive(data, from, metadata);
  });
  // A peer arriving gets this gallery whole, and the pictures hung in it; it
  // sends its own back, and the two merge the same way on both sides.
  transport.onJoin((peerId) => {
    useStore.getState().peerJoined(peerId);
    sayHello(transport, peerId);
    sayPresenceAgain();
    const state = useStore.getState();
    const message: SnapshotMessage = { kind: "snapshot", state: snapshotOf(state) };
    transport.send(message, peerId);
    for (const { value: hanging } of Object.values(state.hangings)) {
      if (hanging !== null) {
        void sendPicture(transport, hanging.pictureId, peerId);
      }
    }
  });
  transport.onLeave((peerId) => {
    useStore.getState().peerLeft(peerId);
    dropPresence(peerId);
  });
  // A new name or colour is said to everyone.
  const saidOf = (own: { readonly name: string; readonly color: string | undefined }): string =>
    own.name + "/" + swatchIdFor(own.name, own.color);
  let said = saidOf(useOwnStore.getState());
  joined.stopNaming = useOwnStore.subscribe((own) => {
    if (saidOf(own) !== said) {
      said = saidOf(own);
      sayHello(transport);
    }
  });
  joined.stopTelling = onAction((call) => {
    const message: ActionMessage = { kind: "action", call };
    transport.send(message);
    // A picture hung here goes with its hanging, once, to everyone.
    if (call.action === "hang" && isHanging(call.args[0])) {
      void sendPicture(transport, call.args[0].pictureId);
    }
  });
}

// What a peer sent: a picture or its bytes, its presence, a hello with its
// name, a snapshot to merge, or an action to replay.
function receive(data: unknown, from: string, metadata: unknown): void {
  if (receivePicture(data, metadata) || receivePresence(data, from)) {
    return;
  }
  if (isHelloMessage(data)) {
    useStore.getState().peerNamed(from, data.name, data.user, data.color);
  } else if (isSnapshotMessage(data)) {
    absorbSnapshot(data.state);
  } else if (isActionMessage(data)) {
    replay(data);
  } else {
    reportError(new Error(`a peer, ${from}, sent something unknown`));
  }
}

/** Leave the viewing, if in one, and go back to the solo gallery. */
export async function leaveViewing(): Promise<void> {
  const joined = current;
  if (joined === undefined) {
    return;
  }
  current = undefined;
  await leave(joined);
  await switchTo(keyForViewing(undefined));
}

// Unbind and let the viewing go; the store is the caller's to switch. The
// library lets its room go a moment after it is told, and a join of the same code
// before then would get the dying one back, so this waits for it.
async function leave(joined: Joined): Promise<void> {
  joined.isLeft = true;
  joined.stopTelling();
  joined.stopNaming();
  useStore.getState().leftViewing();
  bindPresence(undefined);
  clearPresence();
  await joined.transport?.leave().catch(reportError);
}

/** The peers the transport itself knows of, for a look under the hood. */
export function currentPeers(): readonly string[] {
  return current?.transport?.peers() ?? [];
}

// A peer's action, replayed by name with its own time and marked remote.
function replay(data: ActionMessage): void {
  const { action, args, at } = data.call;
  // Every shared action is a function of the store taking its arguments then its time.
  const state = useStore.getState() as unknown as Record<string, unknown>;
  const act = state[action];
  if (typeof act === "function") {
    (act as (...parameters: unknown[]) => void).call(state, ...args, { at, remote: true });
  }
}

// Who this screen is, said to one peer or to all.
function sayHello(transport: Transport, to?: string): void {
  const { name, userId, color } = useOwnStore.getState();
  const message: HelloMessage = {
    kind: "hello",
    name,
    user: userId,
    color: swatchIdFor(name, color),
  };
  transport.send(message, to);
}
