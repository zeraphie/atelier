/**
 * ─ Viewing chip ─
 *
 * The viewing's place in the top-right pill: who is here, each peer as
 * its initial in its colour, then "Just you" until a peer arrives and a
 * count after; Share, which copies this viewing's link and says so for
 * a moment; and, away from home, Leave, which goes back to the viewing
 * this browser made for itself.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { useOwnStore } from "../../state/own-store.js";
import { useStore } from "../../state/store.js";
import { colorFor, initialOf } from "../../viewing/color.js";
import { PillButton, PillLabel } from "../atoms/Pill.js";
import { goHome } from "../utils/use-viewing.js";

/** How long "Link copied" shows, in milliseconds. */
const COPIED_MS = 2000;
const INITIAL =
  "flex size-6 items-center justify-center rounded-full bg-[var(--person)] font-sans text-xs " +
  "font-bold text-accent-ink ring-2 ring-surface";

export function ViewingChip() {
  const code = useStore((store) => store.viewingCode);
  const peers = useStore((store) => store.peers);
  const home = useOwnStore((store) => store.home);
  const [isCopied, setCopied] = useState(false);
  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [isCopied]);
  if (code === undefined) {
    return null;
  }
  const share = (): void => {
    // The link is the address; a clipboard that will not take it is no failure.
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => setCopied(true))
      .catch(() => {});
  };
  const named = Object.entries(peers).filter(([, peer]) => peer.name !== "");
  const count = Object.keys(peers).length;
  const here = isCopied ? "Link copied" : count === 0 ? "Just you" : `${count + 1} here`;
  return (
    <>
      <PillLabel className="gap-2 border-l-0" aria-live="polite">
        {named.length > 0 && (
          <span className="flex -space-x-1.5" aria-hidden="true">
            {named.map(([id, peer]) => (
              <span
                key={id}
                className={INITIAL}
                style={{ "--person": colorFor(peer.name, peer.color) } as CSSProperties}
                title={peer.name}
              >
                {initialOf(peer.name)}
              </span>
            ))}
          </span>
        )}
        {here}
      </PillLabel>
      <PillButton className="px-3" onClick={share} title="Copy a link to this viewing">
        Share
      </PillButton>
      {code !== home && (
        <PillButton divided className="px-3" onClick={goHome} title="Back to your own viewing">
          Leave
        </PillButton>
      )}
    </>
  );
}
