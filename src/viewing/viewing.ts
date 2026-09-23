/**
 * ─ Viewing ─
 *
 * A shared viewing, joined by its code: the gallery store switches to the
 * viewing's own key, the viewing is joined in the background, and from then on every
 * action this screen takes is sent to the peers and every action a peer
 * takes is replayed here by name, marked remote so it is not told again.
 * Leaving unbinds, leaves the viewing and switches the store back to the
 * solo gallery. Joining the viewing already joined is nothing, so
 * StrictMode's double mount joins once; a leave during a join cancels
 * it, and the store switches in order whatever the timing.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import type { Thread } from "../comments/model.js";
import { derivativeKey } from "../pictures/prepare.js";
import { useOwnStore } from "../state/own-store.js";
import type { Hanging } from "../state/slices/pictures.js";
import {
  absorbSnapshot,
  GALLERY_KEY,
  keyForViewing,
  switchGallery,
  useStore,
} from "../state/store.js";
import { onAction } from "../state/utils/actions.js";
import { getPicture, hydration, putPicture, stateStorage } from "../storage/index.js";
import { swatchIdFor } from "./color.js";
import { viewingCodeFromHash } from "./hash.js";
import {
  isActionMessage,
  isBytesMetadata,
  isHelloMessage,
  isPictureMessage,
  isSnapshotMessage,
  type ActionMessage,
  type BytesMetadata,
  type HelloMessage,
  type PictureMessage,
  type SnapshotMessage,
} from "./message.js";
import { snapshotOf } from "./snapshot.js";
import { connect, type Transport } from "./transport.js";

interface Joined {
  readonly code: string;
  transport: Transport | undefined;
  stopTelling: () => void;
  stopNaming: () => void;
  isLeft: boolean;
}

let current: Joined | undefined;

// A viewing named in the address at load is part of the roll call the curtain
// waits on: its saved state is switched to before the gallery shows.
const VIEWING_LOAD = "viewing";
if (viewingCodeFromHash(window.location.hash) !== undefined) {
  hydration.expect(VIEWING_LOAD);
}
// Switches of the gallery's key run one after another, so a leave that
// follows a join always lands after it.
let switching: Promise<void> = Promise.resolve();

function switchTo(key: string): Promise<void> {
  switching = switching.then(() => switchGallery(key));
  return switching;
}

/** Join the viewing `code`, leaving any other first; joining the viewing already joined is nothing. */
export async function joinViewing(code: string): Promise<void> {
  if (current?.code === code) {
    return;
  }
  await leaveViewing();
  const joined: Joined = {
    code,
    transport: undefined,
    stopTelling: () => {},
    stopNaming: () => {},
    isLeft: false,
  };
  current = joined;
  try {
    await switchTo(keyForViewing(code));
  } finally {
    hydration.loaded(VIEWING_LOAD);
  }
  if (joined.isLeft) {
    return;
  }
  useStore.getState().enteredViewing(code);
  useOwnStore.getState().noteViewing(code);
  let transport: Transport;
  try {
    transport = await connect(code);
  } catch (error: unknown) {
    reportError(error);
    return;
  }
  if (joined.isLeft) {
    transport.leave().catch(reportError);
    return;
  }
  joined.transport = transport;
  transport.onMessage((data, from, metadata) => {
    receive(data, from, metadata);
  });
  // A peer arriving gets this gallery whole, and the pictures hung in it; it
  // sends its own back, and the two merge the same way on both sides.
  transport.onJoin((peerId) => {
    useStore.getState().peerJoined(peerId);
    sayHello(transport, peerId);
    const state = useStore.getState();
    const message: SnapshotMessage = { kind: "snapshot", state: snapshotOf(state) };
    transport.send(message, peerId);
    for (const { value: hanging } of Object.values(state.hangings)) {
      if (hanging !== null) {
        void sendPicture(transport, hanging.pictureId, peerId);
      }
    }
  });
  transport.onLeave((peerId) => useStore.getState().peerLeft(peerId));
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

/** Replay the solo gallery's threads here, telling each, so the viewing has them too. */
export async function bringComments(): Promise<number> {
  const saved = await stateStorage.getItem(GALLERY_KEY);
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
  const { pending: _pending, ...known } = record;
  const message: PictureMessage = { kind: "picture", record: known, by: own.name };
  transport.send(message, to);
  const metadata: BytesMetadata = { kind: "bytes", id: pictureId };
  transport.send(blob, to, metadata);
}

// What a peer sent: a hello with its name, an action to replay, a snapshot to
// merge, a picture's record to keep, or its bytes, which the library may hand
// over as a buffer.
function receive(data: unknown, from: string, metadata: unknown): void {
  const bytes = asBlob(data);
  if (isBytesMetadata(metadata) && bytes !== undefined) {
    void keepBytes(metadata.id, bytes);
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
    const { pending: _pending, ...whole } = record;
    useOwnStore.getState().addPicture(whole);
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
  joined.isLeft = true;
  joined.stopTelling();
  joined.stopNaming();
  useStore.getState().leftViewing();
  // The library lets the room go a moment after it is told; a join of the same
  // room before then would get the dying one back, so leaving waits for it.
  await joined.transport?.leave().catch(reportError);
  await switchTo(keyForViewing(undefined));
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
