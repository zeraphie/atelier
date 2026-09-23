/**
 * ─ Use viewing ─
 *
 * The address decides the viewing: on load and whenever the hash
 * changes, the viewing it names is joined and any other left, and
 * unmounting leaves. Joining happens in the background, so the gallery
 * is never held up by the relays; until a peer arrives it is just you.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import { useEffect } from "react";
import { viewingCodeFromHash } from "../../viewing/hash.js";
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
