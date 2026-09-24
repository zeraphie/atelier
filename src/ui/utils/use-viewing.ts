/**
 * ─ Use viewing ─
 *
 * The address decides the viewing: whenever the hash changes, the
 * viewing it names is joined and any other left, and unmounting
 * leaves. The first join is the arrival card's, once the person has
 * come in, so nothing is joined behind the curtain unasked. Joining
 * happens in the background; until a peer arrives it is just you.
 * Entering and leaving by the interface go through the address too, so
 * there is one way in and one way out; leaving goes home, the viewing
 * this browser made for itself. Your pointer is said to the viewing as
 * it moves over the canvas, from the canvas session's own record of it,
 * except while you follow someone: on a view that is not your own it
 * would point at nothing of your choosing, so no screen shows it.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { useEffect } from "react";
import { useOwnStore } from "../../state/own-store.js";
import { useStore } from "../../state/store.js";
import { newViewingCode } from "../../viewing/identity/code.js";
import { hashForViewing, viewingCodeFromHash } from "../../viewing/identity/hash.js";
import { sayCursor } from "../../viewing/presence/presence.js";
import { joinViewing, leaveViewing } from "../../viewing/viewing.js";
import { useCanvas } from "./canvas-context.js";

/** Follows the address: the viewing it names is joined and any other left, and unmounting leaves. */
export function useViewing(): void {
  useEffect(() => {
    const follow = (): void => {
      const code = viewingCodeFromHash(window.location.hash);
      if (code === undefined) {
        void leaveViewing();
      } else {
        void joinViewing(code);
      }
    };
    window.addEventListener("hashchange", follow);
    return () => {
      window.removeEventListener("hashchange", follow);
      void leaveViewing();
    };
  }, []);
}

/** Put a viewing in the address, which joins it. */
export function enterViewing(code: string): void {
  window.location.hash = hashForViewing(code);
}

/** Go home: the viewing this browser made for itself, made now if it has none. */
export function goHome(): void {
  const own = useOwnStore.getState();
  let { home } = own;
  if (home === undefined) {
    home = newViewingCode();
    own.setHome(home);
  }
  enterViewing(home);
}

/** Your pointer, said to the viewing as it moves, and said gone while you follow someone or when this unmounts. */
export function useCursorSharing(): void {
  const { pointer } = useCanvas();
  const isFollowing = useStore((store) => store.following !== undefined);
  useEffect(() => {
    if (isFollowing) {
      sayCursor(undefined);
      return;
    }
    sayCursor(pointer.current);
    const stop = pointer.subscribe(sayCursor);
    return () => {
      stop();
      sayCursor(undefined);
    };
  }, [pointer, isFollowing]);
}
