/**
 * ─ Comment list ─
 *
 * The comments' corner: one pill with the way to add a comment and
 * the way to every thread. The list is grouped by room in the order
 * the rooms are walked, open or resolved or all, and each thread is a
 * way there: choosing one glides the view to its pin and opens it, so
 * a comment whose pin is off screen is never lost. The panel folds
 * away behind its button, which keeps the count of open threads.
 * Decision: DECISIONS.md, finding a comment: the list, the map and the jump.
 */

import { useState } from "react";
import { centredOn, moveTo } from "../../camera/index.js";
import { filterThreads, groupByRoom, type ListFilter } from "../../comments/list.js";
import type { Thread } from "../../comments/model.js";
import { usePlan } from "../../state/utils/plan.js";
import { useStore } from "../../state/store.js";
import { Card } from "../atoms/Card.js";
import { CommentIcon, PenIcon } from "../atoms/icons.js";
import { Pill, PillButton } from "../atoms/Pill.js";
import { bringComments } from "../../viewing/viewing.js";
import { TextButton } from "../atoms/TextButton.js";
import { ThreadItem } from "../molecules/ThreadItem.js";
import { ViewingChip } from "./ViewingChip.js";
import { useCanvas } from "../utils/canvas-context.js";

// A jump comes in at least this close, so the pin arrives on its work and wall, not on a plan.
const READING_ZOOM = 2;

const FILTERS: readonly { readonly id: ListFilter; readonly label: string }[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "all", label: "All" },
];

const FILTER =
  "rounded px-2 py-1 font-sans text-xs text-muted hover:bg-canvas hover:text-ink " +
  "aria-pressed:bg-ink aria-pressed:text-surface aria-pressed:hover:bg-ink " +
  "focus-visible:outline-2 focus-visible:outline-accent";

export function CommentList() {
  const threads = useStore((store) => store.threads);
  const mode = useStore((store) => store.mode);
  const setMode = useStore((store) => store.setMode);
  const viewingCode = useStore((store) => store.viewingCode);
  const [isOpen, setOpen] = useState(false);
  const [filter, setFilter] = useState<ListFilter>("open");
  const plan = usePlan();
  const isCommenting = mode === "comment";
  const isEditing = mode === "edit";
  const openCount = threads.filter((thread) => !thread.resolved).length;
  const groups = groupByRoom(plan, filterThreads(threads, filter));
  return (
    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
      <Pill>
        <ViewingChip />
        <PillButton
          divided
          aria-pressed={isEditing}
          aria-label="Edit the gallery"
          title="Edit the gallery (E)"
          onClick={() => setMode(isEditing ? "browse" : "edit")}
        >
          <PenIcon />
        </PillButton>
        <PillButton
          divided
          aria-pressed={isCommenting}
          aria-label="Add a comment"
          title="Add a comment (C)"
          onClick={() => setMode(isCommenting ? "browse" : "comment")}
        >
          <CommentIcon />
        </PillButton>
        <PillButton
          divided
          className="px-3"
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
        </PillButton>
      </Pill>
      {isOpen && (
        <Card
          id="comment-list"
          aria-label="Comments"
          className="flex max-h-[calc(100dvh-17rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden"
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
                        <ListedThread thread={thread} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {viewingCode !== undefined && (
            <div className="border-t border-line px-2 py-1.5">
              <TextButton
                onClick={() => {
                  bringComments().catch(reportError);
                }}
              >
                Bring my comments in
              </TextButton>
            </div>
          )}
        </Card>
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

// A thread in the list, and what choosing it does: a glide to its pin, and the thread opened.
function ListedThread({ thread }: { readonly thread: Thread }) {
  const { camera, view } = useCanvas();
  const isOpen = useStore((store) => store.openThreadId === thread.id);
  const showThread = useStore((store) => store.showThread);
  const jump = (): void => {
    const size = view.current;
    const zoom = Math.max(camera.current.zoom, READING_ZOOM);
    moveTo(camera, centredOn(thread.at, zoom, size), size);
    showThread(thread.id);
  };
  return <ThreadItem thread={thread} isOpen={isOpen} onSelect={jump} />;
}
