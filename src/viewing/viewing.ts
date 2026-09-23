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

import { useOwnStore } from "../state/own-store.js";
import { keyForViewing, switchGallery, useStore } from "../state/store.js";
import { onAction } from "../state/utils/actions.js";
import { isActionMessage, type ActionMessage } from "./message.js";
import { connect, type Transport } from "./transport.js";

interface Joined {
  readonly code: string;
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

/** Join the viewing `code`, leaving any other first; joining the viewing already joined is nothing. */
export async function joinViewing(code: string): Promise<void> {
  if (current?.code === code) {
    return;
  }
  await leaveViewing();
  const joined: Joined = { code, transport: undefined, stopTelling: () => {}, isLeft: false };
  current = joined;
  await switchTo(keyForViewing(code));
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

/** Leave the viewing, if in one, and go back to the solo gallery. */
export async function leaveViewing(): Promise<void> {
  const joined = current;
  if (joined === undefined) {
    return;
  }
  current = undefined;
  joined.isLeft = true;
  joined.stopTelling();
  joined.transport?.leave();
  useStore.getState().leftViewing();
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
