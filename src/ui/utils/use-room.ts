/**
 * ─ Use room ─
 *
 * The address decides the room: on load and whenever the hash changes,
 * the room it names is joined and any other left, and unmounting leaves.
 * Joining happens in the background, so the gallery is never held up
 * by the relays; until a peer arrives the room is just you.
 * Decision: DECISIONS.md, a room is opt-in by link and siloed.
 */

import { useEffect } from "react";
import { roomIdFromHash } from "../../room/hash.js";
import { joinRoom, leaveRoom } from "../../room/room.js";

export function useRoom(): void {
  useEffect(() => {
    const follow = (): void => {
      const id = roomIdFromHash(window.location.hash);
      if (id === undefined) {
        void leaveRoom();
      } else {
        void joinRoom(id);
      }
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => {
      window.removeEventListener("hashchange", follow);
      void leaveRoom();
    };
  }, []);
}
