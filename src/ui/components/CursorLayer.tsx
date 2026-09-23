/**
 * ─ Cursor layer ─
 *
 * The others' pointers, above the canvas: an arrow per peer in their
 * colour, their name at its heel, placed by the same camera as the
 * pins, so it points at the same thing on every screen. Only a peer
 * with a pointer over its canvas has one, and only once it has said
 * hello is there a name to show. The layer takes no pointer events.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { CSSProperties } from "react";
import { worldToScreen } from "../../camera/index.js";
import { useStore } from "../../state/store.js";
import { colorFor } from "../../viewing/color.js";
import { cursors } from "../../viewing/cursors.js";
import { CursorIcon } from "../atoms/icons.js";
import { useCameraState } from "../utils/canvas-context.js";
import { useValue } from "../utils/use-value.js";

const NAME =
  "absolute top-4 left-3.5 rounded-full bg-[var(--person)] px-1.5 py-0.5 " +
  "font-sans text-xs font-bold whitespace-nowrap text-accent-ink shadow-sm";

export function CursorLayer() {
  const camera = useCameraState();
  const placed = useValue(cursors);
  const peers = useStore((store) => store.peers);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Object.entries(placed).map(([peerId, at]) => {
        const peer = peers[peerId];
        if (peer === undefined) {
          return null;
        }
        const screen = worldToScreen(camera, at);
        return (
          <div
            key={peerId}
            className="absolute top-0 left-0"
            style={
              {
                transform: `translate(${screen.x}px, ${screen.y}px)`,
                "--person": colorFor(peer.name, peer.color),
              } as CSSProperties
            }
          >
            <CursorIcon />
            {peer.name !== "" && <span className={NAME}>{peer.name}</span>}
          </div>
        );
      })}
    </div>
  );
}
