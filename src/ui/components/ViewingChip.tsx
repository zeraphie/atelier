/**
 * ─ Viewing chip ─
 *
 * The viewing's place in the top-right pill. Alone, a Share button:
 * it makes a code, puts it in the address, which joins the viewing,
 * and copies the link, saying so for a moment. In a viewing, who is
 * here, "Just you" until a peer arrives, then a count, and Leave.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

import { useEffect, useState } from "react";
import { useStore } from "../../state/store.js";
import { newViewingCode } from "../../viewing/code.js";
import { PillButton, PillLabel } from "../atoms/Pill.js";
import { enterViewing, exitViewing } from "../utils/use-viewing.js";

/** How long "Link copied" shows, in milliseconds. */
const COPIED_MS = 2000;

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
  const here = isCopied
    ? "Link copied"
    : peers.length === 0
      ? "Just you"
      : `${peers.length + 1} here`;
  return (
    <>
      <PillLabel className="border-l-0" aria-live="polite">
        {here}
      </PillLabel>
      <PillButton className="px-3" onClick={exitViewing} title="Leave the viewing">
        Leave
      </PillButton>
    </>
  );
}
