/**
 * ─ Presence ─
 *
 * What is said once a frame and kept per peer. Your pointer and your
 * look go to whichever transport is bound, and to no one while none
 * is; theirs are placed as they come, dropped when a peer goes and
 * cleared on leaving; and following is told to the one followed. The
 * viewing binds the transport here and hands the presence messages
 * over, so it never reads a cursor itself.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { roundedPoint, samePoint, type Point } from "../../geometry.js";
import { useStore } from "../../state/store.js";
import {
  isCursorMessage,
  isFollowMessage,
  isLookMessage,
  type CursorMessage,
  type FollowMessage,
  type LookMessage,
} from "../message.js";
import type { Transport } from "../transport.js";
import { clearCursors, dropCursor, placeCursor } from "./cursors.js";
import { clearLooks, dropLook, placeLook, sameLook, type Look } from "./looks.js";
import { Sayer } from "./sayer.js";

let transport: Transport | undefined;

const refresh = (tell: () => void): void => {
  requestAnimationFrame(tell);
};
const cursorSayer = new Sayer<Point>(
  refresh,
  (at) => {
    const message: CursorMessage = { kind: "cursor", at };
    transport?.send(message);
  },
  samePoint
);
const lookSayer = new Sayer<Look>(
  refresh,
  (at) => {
    const message: LookMessage = { kind: "look", at };
    transport?.send(message);
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
  if (transport === undefined || !transport.peers().includes(peerId)) {
    return;
  }
  const message: FollowMessage = { kind: "follow", is };
  transport.send(message, peerId);
}

/** The transport presence goes out on from now; none while the viewing is unbound. */
export function bindPresence(next: Transport | undefined): void {
  transport = next;
}

/** Say your pointer and your look again, to a peer who just arrived. */
export function sayPresenceAgain(): void {
  cursorSayer.sayAgain();
  lookSayer.sayAgain();
}

/** A peer's presence kept: where its pointer is, where it looks, or that it follows this screen; false for any other message. */
export function receivePresence(data: unknown, from: string): boolean {
  if (isCursorMessage(data)) {
    placeCursor(from, data.at);
  } else if (isLookMessage(data)) {
    placeLook(from, data.at);
  } else if (isFollowMessage(data)) {
    useStore.getState().followedBy(from, data.is);
  } else {
    return false;
  }
  return true;
}

/** A peer gone: its pointer and its look with it. */
export function dropPresence(peerId: string): void {
  dropCursor(peerId);
  dropLook(peerId);
}

/** Everyone's presence gone, as on leaving a viewing. */
export function clearPresence(): void {
  clearCursors();
  clearLooks();
}
