/**
 * ─ Viewing ─
 *
 * A shared viewing, joined by its code: the gallery store switches to the
 * viewing's own key, the viewing is joined in the background, and from then on every
 * action this screen takes is sent to the peers and every action a peer
 * takes is replayed here by name, marked remote so it is not told again;
 * your pointer and where you look go the same way, once a frame, and theirs
 * are kept for the cursor layer and for following.
 * Leaving unbinds, leaves the viewing and switches the store back to the
 * solo gallery. Joining the viewing already joined is nothing, so
 * StrictMode's double mount joins once; a leave during a join cancels
 * it, and the store switches in order whatever the timing.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { Thread } from "../comments/model.js";
import { roundedPoint, samePoint, type Point } from "../geometry.js";
import { derivativeKey } from "../pictures/prepare.js";
import { useOwnStore } from "../state/own-store.js";
import type { Hanging } from "../state/slices/pictures.js";
import { absorbSnapshot, keyForViewing, switchGallery, useStore } from "../state/store.js";
import { onAction } from "../state/utils/actions.js";
import { without } from "../state/utils/records.js";
import { getPicture, putPicture, stateStorage } from "../storage/index.js";
import { swatchIdFor } from "./color.js";
import { clearCursors, dropCursor, placeCursor } from "./cursors.js";
import {
  isActionMessage,
  isBytesMetadata,
  isCursorMessage,
  isFollowMessage,
  isHelloMessage,
  isPictureMessage,
  isSnapshotMessage,
  isLookMessage,
  type ActionMessage,
  type BytesMetadata,
  type CursorMessage,
  type FollowMessage,
  type HelloMessage,
  type PictureMessage,
  type SnapshotMessage,
  type LookMessage,
} from "./message.js";
import { Sayer } from "./sayer.js";
import { snapshotOf } from "./snapshot.js";
import { connect, type Transport } from "./transport.js";
import { clearLooks, dropLook, placeLook, sameLook, type Look } from "./looks.js";

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

// Your pointer and your view, each said once a frame to whichever transport
// is bound, and to no one while none is.
const refresh = (tell: () => void): void => {
  requestAnimationFrame(tell);
};
const cursorSayer = new Sayer<Point>(
  refresh,
  (at) => {
    const message: CursorMessage = { kind: "cursor", at };
    current?.transport?.send(message);
  },
  samePoint
);
const lookSayer = new Sayer<Look>(
  refresh,
  (at) => {
    const message: LookMessage = { kind: "look", at };
    current?.transport?.send(message);
  },
  sameLook
);

/** Say where your pointer is in the world, to the centimetre, or that it is off the canvas; once a frame at most. */
export function sayCursor(at: Point | undefined): void {
  cursorSayer.say(at === undefined ? undefined : roundedPoint(at));
}

/** Say where you are looking; once a frame at most, and only when it changed. */
export function sayLook(look: Look): void {
  lookSayer.say(look);
}

/** Tell a peer you are following them, or no longer; nothing to one who has gone. */
export function sayFollowing(peerId: string, is: boolean): void {
  const transport = current?.transport;
  if (transport === undefined || !transport.peers().includes(peerId)) {
    return;
  }
  const message: FollowMessage = { kind: "follow", is };
  transport.send(message, peerId);
}

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
  transport.onMessage((data, from, metadata) => {
    receive(data, from, metadata);
  });
  // A peer arriving gets this gallery whole, and the pictures hung in it; it
  // sends its own back, and the two merge the same way on both sides.
  transport.onJoin((peerId) => {
    useStore.getState().peerJoined(peerId);
    sayHello(transport, peerId);
    cursorSayer.sayAgain();
    lookSayer.sayAgain();
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
    dropCursor(peerId);
    dropLook(peerId);
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

/** Replay another viewing's saved threads here, telling each, so this viewing has them too. */
export async function bringCommentsFrom(code: string): Promise<number> {
  const saved = await stateStorage.getItem(keyForViewing(code));
  if (saved === null) {
    return 0;
  }
  const { state } = JSON.parse(saved) as { state?: { threads?: Thread[] } };
  const threads = state?.threads ?? [];
  const { putThread } = useStore.getState();
  for (const thread of threads) {
    putThread(thread);
  }
  return threads.length;
}

// A picture for a peer, in two parts: its record first, so the hanging shows
// at once as a placeholder, then its derivative as bytes; nothing when the
// picture is not here, as with one that came from elsewhere and never arrived.
async function sendPicture(transport: Transport, pictureId: string, to?: string): Promise<void> {
  const own = useOwnStore.getState();
  const record = own.pictures[pictureId];
  const blob = await getPicture(derivativeKey(pictureId));
  if (record === undefined || blob === undefined) {
    return;
  }
  const known = without(record, "pending");
  const message: PictureMessage = { kind: "picture", record: known, by: own.name };
  transport.send(message, to);
  const metadata: BytesMetadata = { kind: "bytes", id: pictureId };
  transport.send(blob, to, metadata);
}

// What a peer sent: where its pointer is or where it is looking, that it is
// following this screen or no longer, a hello with its name, an action to
// replay, a snapshot to merge, a picture's record to keep, or its bytes, which
// the library may hand over as a buffer.
function receive(data: unknown, from: string, metadata: unknown): void {
  const bytes = asBlob(data);
  if (isBytesMetadata(metadata) && bytes !== undefined) {
    void keepBytes(metadata.id, bytes);
  } else if (isCursorMessage(data)) {
    placeCursor(from, data.at);
  } else if (isLookMessage(data)) {
    placeLook(from, data.at);
  } else if (isFollowMessage(data)) {
    useStore.getState().followedBy(from, data.is);
  } else if (isHelloMessage(data)) {
    useStore.getState().peerNamed(from, data.name, data.user, data.color);
  } else if (isPictureMessage(data)) {
    void keepRecord(data);
  } else if (isSnapshotMessage(data)) {
    absorbSnapshot(data.state);
  } else if (isActionMessage(data)) {
    replay(data);
  } else {
    reportError(new Error(`a peer, ${from}, sent something unknown`));
  }
}

// A record from a peer joins the collection marked with whose it is, and as
// pending until its bytes are here, unless they arrived first.
async function keepRecord({ record, by }: PictureMessage): Promise<void> {
  const own = useOwnStore.getState();
  if (own.pictures[record.id] !== undefined) {
    return;
  }
  const isHere = (await getPicture(derivativeKey(record.id))) !== undefined;
  own.addPicture({ ...record, from: by, ...(isHere ? {} : { pending: true }) });
}

// A picture's bytes are kept once by id, and its record, if pending, is whole.
async function keepBytes(id: string, blob: Blob): Promise<void> {
  if ((await getPicture(derivativeKey(id))) === undefined) {
    await putPicture(derivativeKey(id), blob);
  }
  const record = useOwnStore.getState().pictures[id];
  if (record?.pending === true) {
    useOwnStore.getState().addPicture(without(record, "pending"));
  }
}

function isHanging(value: unknown): value is Hanging {
  return (
    typeof value === "object" && value !== null && typeof (value as Hanging).pictureId === "string"
  );
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

// Unbind and let the room go; the store is the caller's to switch. The library
// lets the room go a moment after it is told, and a join of the same room
// before then would get the dying one back, so this waits for it.
async function leave(joined: Joined): Promise<void> {
  joined.isLeft = true;
  joined.stopTelling();
  joined.stopNaming();
  useStore.getState().leftViewing();
  clearCursors();
  clearLooks();
  await joined.transport?.leave().catch(reportError);
}

/** The viewing joined, for the interface and the tests. */
export function currentViewingCode(): string | undefined {
  return current?.code;
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

// Binary data as a blob, whichever shape it arrived in; nothing for anything else.
function asBlob(data: unknown): Blob | undefined {
  if (data instanceof Blob) {
    return data;
  }
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return new Blob([data as BlobPart], { type: "image/jpeg" });
  }
  return undefined;
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
