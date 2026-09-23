/**
 * ─ Viewing chip ─
 *
 * The viewing's place in the top-right pill. Alone, a Share button:
 * it makes a code, puts it in the address, which joins the viewing,
 * and copies the link, saying so for a moment. In a viewing, who is
 * here: each peer as its initial in its own colour, then "Just you"
 * until a peer arrives and a count after, and Leave.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import { useEffect, useState, type CSSProperties } from "react";
import { useStore } from "../../state/store.js";
import { newViewingCode } from "../../viewing/code.js";
import { colorFor, initialOf } from "../../viewing/color.js";
import { PillButton, PillLabel } from "../atoms/Pill.js";
import { enterViewing, exitViewing } from "../utils/use-viewing.js";

/** How long "Link copied" shows, in milliseconds. */
const COPIED_MS = 2000;
const INITIAL =
  "flex size-6 items-center justify-center rounded-full bg-[var(--person)] font-sans text-xs " +
  "font-bold text-accent-ink ring-2 ring-surface";

export function ViewingChip() {
  const code = useStore((store) => store.viewingCode);
  const peers = useStore((store) => store.peers);
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
  const share = (): void => {
    enterViewing(newViewingCode());
    // The link is the address once the hash is in it; a clipboard that will not take it is no failure.
    navigator.clipboard
      ?.writeText(window.location.href)
      .then(() => setCopied(true))
      .catch(() => {});
  };
  if (code === undefined) {
    return (
      <PillButton className="px-3" onClick={share} title="Share a link to view together">
        Share
      </PillButton>
    );
  }
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
                style={{ "--person": colorFor(peer.name) } as CSSProperties}
                title={peer.name}
              >
                {initialOf(peer.name)}
              </span>
            ))}
          </span>
        )}
        {here}
      </PillLabel>
      <PillButton className="px-3" onClick={exitViewing} title="Leave the viewing">
        Leave
      </PillButton>
    </>
  );
}
