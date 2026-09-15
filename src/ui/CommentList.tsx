/**
 * ─ Comment list ─
 *
 * Every thread in one place, off the canvas: grouped by room in the
 * order the rooms are walked, open or resolved or all, and each one a
 * way there. Choosing a thread glides the view to its pin and opens
 * it, so a comment whose pin is off screen is never lost. The panel
 * folds away behind its button, which keeps the count of open threads.
 * Decision: DECISIONS.md, finding a comment: the list, the map and the jump.
 */

import { useState } from "react";
import { centredOn, moveTo } from "../camera/index.js";
import { filterThreads, groupByRoom, type ListFilter } from "../comments/list.js";
import type { Thread } from "../comments/model.js";
import { useCommentsStore } from "../comments/store.js";
import { useUiStore } from "../comments/ui-store.js";
import { whenWas } from "../comments/when.js";
import { PLAN } from "../gallery/plan.js";
import { useCanvas } from "./canvas-context.js";
import { useNow } from "./use-now.js";

// A jump comes in at least this close, so the pin arrives on its work and wall, not on a plan.
const READING_ZOOM = 2;

const FILTERS: readonly { readonly id: ListFilter; readonly label: string }[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All" },
];

const TOGGLE =
  "flex h-8 items-center gap-2 rounded-md border border-line bg-surface px-3 font-sans text-sm text-ink shadow-sm " +
  "hover:bg-canvas aria-expanded:bg-canvas focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";
const FILTER =
  "rounded px-2 py-1 font-sans text-xs text-muted hover:bg-canvas hover:text-ink " +
  "aria-pressed:bg-ink aria-pressed:text-surface aria-pressed:hover:bg-ink " +
  "focus-visible:outline-2 focus-visible:outline-accent";
const ITEM =
  "flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-canvas data-[open=true]:bg-canvas " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";

export function CommentList() {
  const threads = useCommentsStore((store) => store.threads);
  const [isOpen, setOpen] = useState(false);
  const [filter, setFilter] = useState<ListFilter>("open");
  const openCount = threads.filter((thread) => !thread.resolved).length;
  const groups = groupByRoom(PLAN, filterThreads(threads, filter));
  return (
    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
      <button
        type="button"
        className={TOGGLE}
        aria-expanded={isOpen}
        aria-controls="comment-list"
        onClick={() => setOpen(!isOpen)}
      >
        Comments
        {openCount > 0 && (
          <span className="rounded-full bg-accent px-1.5 font-mono text-xs text-accent-ink tabular-nums">
            {openCount}
          </span>
        )}
      </button>
      {isOpen && (
        <section
          id="comment-list"
          aria-label="Comments"
          className="flex max-h-[calc(100dvh-17rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-md border border-line bg-surface shadow-md"
        >
          <div className="flex gap-1 border-b border-line p-1">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={FILTER}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {groups.length === 0 ? (
            <p className="px-3 py-4 font-sans text-sm text-muted">{emptyWording(filter)}</p>
          ) : (
            <div className="overflow-y-auto pb-1">
              {groups.map((group) => (
                <section key={group.id} aria-label={group.name}>
                  <h3 className="px-3 pt-3 pb-1 font-display text-xs text-muted">{group.name}</h3>
                  <ul>
                    {group.threads.map((thread) => (
                      <li key={thread.id}>
                        <ThreadItem thread={thread} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// What an empty list says: named, never a blank.
function emptyWording(filter: ListFilter): string {
  if (filter === "resolved") {
    return "Nothing resolved yet.";
  }
  const which = filter === "open" ? "No open comments." : "No comments yet.";
  return `${which} Press C, or right-click the canvas, to add one.`;
}

// One thread in the list: who opened it and when, its opening words, replies and state.
function ThreadItem({ thread }: { readonly thread: Thread }) {
  const { camera, view } = useCanvas();
  const isOpen = useUiStore((store) => store.openThreadId === thread.id);
  const openThread = useUiStore((store) => store.openThread);
  const now = useNow();
  const first = thread.comments[0];
  const replies = thread.comments.length - 1;
  const jump = (): void => {
    const size = view.current;
    const zoom = Math.max(camera.current.zoom, READING_ZOOM);
    moveTo(camera, centredOn(thread.at, zoom, size), size);
    openThread(thread.id);
  };
  return (
    <button type="button" className={ITEM} data-open={isOpen} onClick={jump}>
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
