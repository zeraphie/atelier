/**
 * ─ Thread item ─
 *
 * One thread as a row of the list: who opened it and when, its
 * opening words, and the count of replies and its state. A press is
 * reported; what it does is the list's business.
 */

import type { Thread } from "../../comments/model.js";
import { whenWas } from "../../comments/when.js";
import { useNow } from "../utils/use-now.js";

const ITEM =
  "flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-canvas data-[open=true]:bg-canvas " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";

interface ThreadItemProps {
  readonly thread: Thread;
  readonly isOpen: boolean;
  readonly onSelect: () => void;
}

/** One thread as a row of the list: who opened it and when, its opening words, its replies and state. */
export function ThreadItem({ thread, isOpen, onSelect }: ThreadItemProps) {
  const now = useNow();
  const first = thread.comments[0];
  const replies = thread.comments.length - 1;
  return (
    <button type="button" className={ITEM} data-open={isOpen} onClick={onSelect}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-sm font-bold text-ink">{first?.author}</span>
        <span className="font-mono text-xs text-muted">
          {first === undefined ? "" : whenWas(first.createdAt, now)}
        </span>
      </span>
      <span className="line-clamp-2 font-serif text-base leading-snug text-ink">{first?.text}</span>
      {(replies > 0 || thread.resolved) && (
        <span className="font-sans text-xs text-muted">
          {replies > 0 && `${replies} ${replies === 1 ? "reply" : "replies"}`}
          {replies > 0 && thread.resolved && ", "}
          {thread.resolved && <span className="text-resolved">resolved</span>}
        </span>
      )}
    </button>
  );
}
