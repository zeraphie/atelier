/**
 * ─ Viewing chip ─
 *
 * The viewing's place in the top-right pill: who is here, each peer as
 * its initial in its colour, pressed to follow their view and again to
 * stop; then a reading: "Just you" until a peer arrives and a count
 * after, whom you follow, or who follows you; Share, which copies this
 * viewing's link and says so for a moment; and, away from home, Leave,
 * which goes back to the viewing this browser made for itself.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { useEffect, useState } from "react";
import { useOwnStore } from "../../state/own-store.js";
import type { Peer } from "../../state/slices/viewing.js";
import { useStore } from "../../state/store.js";
import { colorFor, initialOf } from "../../viewing/color.js";
import { PillButton, PillLabel } from "../atoms/Pill.js";
import { FOCUS_RING, INITIAL, personStyle } from "../atoms/styles.js";
import { goHome } from "../utils/use-viewing.js";

/** How long "Link copied" shows, in milliseconds. */
const COPIED_MS = 2000;
const PEER =
  `${INITIAL} ${FOCUS_RING} focus-visible:outline-offset-1 size-6 ` +
  "ring-2 ring-surface hover:ring-ink aria-pressed:ring-ink";

export function ViewingChip() {
  const code = useStore((store) => store.viewingCode);
  const peers = useStore((store) => store.peers);
  const following = useStore((store) => store.following);
  const followers = useStore((store) => store.followers);
  const follow = useStore((store) => store.follow);
  const unfollow = useStore((store) => store.unfollow);
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
  const reading = isCopied
    ? "Link copied"
    : wording(Object.keys(peers).length, peers, following, followers);
  return (
    <>
      <PillLabel className="gap-2 border-l-0" aria-live="polite">
        {named.length > 0 && (
          <span className="flex -space-x-1.5">
            {named.map(([id, peer]) => {
              const isFollowed = following === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={PEER}
                  style={personStyle(colorFor(peer.name, peer.color))}
                  aria-pressed={isFollowed}
                  aria-label={isFollowed ? `Stop following ${peer.name}` : `Follow ${peer.name}`}
                  title={isFollowed ? `Stop following ${peer.name}` : `Follow ${peer.name}`}
                  onClick={() => (isFollowed ? unfollow() : follow(id))}
                >
                  {initialOf(peer.name)}
                </button>
              );
            })}
          </span>
        )}
        {reading}
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

// The reading beside the initials: whom you follow first, then who follows
// you, then how many are here.
function wording(
  count: number,
  peers: Readonly<Record<string, Peer>>,
  following: string | undefined,
  followers: readonly string[]
): string {
  const nameOf = (id: string): string => {
    const name = peers[id]?.name ?? "";
    return name === "" ? "Someone" : name;
  };
  if (following !== undefined) {
    return `Following ${nameOf(following)}`;
  }
  if (followers.length === 1) {
    return `${nameOf(followers[0]!)} is following you`;
  }
  if (followers.length === 2) {
    return `${nameOf(followers[0]!)} and ${nameOf(followers[1]!)} are following you`;
  }
  if (followers.length > 2) {
    return `${followers.length} following you`;
  }
  return count === 0 ? "Just you" : `${count + 1} here`;
}
