/**
 * ─ Use viewing ─
 *
 * The address decides the viewing: on load and whenever the hash
 * changes, the viewing it names is joined and any other left, and
 * unmounting leaves. Joining happens in the background, so the gallery
 * is never held up by the relays; until a peer arrives it is just you.
 * Entering and leaving by the interface go through the address too, so
 * there is one way in and one way out.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import { useEffect } from "react";
import { hashForViewing, viewingCodeFromHash } from "../../viewing/hash.js";
import { joinViewing, leaveViewing } from "../../viewing/viewing.js";

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
    follow();
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

/** Take the viewing out of the address, which leaves it, and leave the address clean. */
export function exitViewing(): void {
  window.location.hash = "";
  window.history.replaceState(null, "", window.location.pathname + window.location.search);
}
