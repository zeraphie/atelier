/**
 * ─ Pin layer ─
 *
 * The comments in the DOM, above the canvas: a pin per thread and one
 * for a draft being written, each placed by the same camera the stage
 * follows, so a pin sits on its point in the world through every pan
 * and zoom. The layer itself lets pointer events through to the
 * canvas; only the pins take them.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import { Popover, Tooltip } from "radix-ui";
import { worldToScreen, type Point } from "../camera/index.js";
import type { Thread as ThreadModel } from "../comments/model.js";
import { useCommentsStore } from "../comments/store.js";
import { useUiStore } from "../comments/ui-store.js";
import { whenWas } from "../comments/when.js";
import { useCameraState } from "./canvas-context.js";
import { CommentForm } from "./CommentForm.js";
import { Thread } from "./Thread.js";
import { useNow } from "./use-now.js";

const PIN =
  "pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 flex size-7 items-center justify-center " +
  "rounded-full border-2 border-surface font-sans text-xs font-bold shadow-md transition-[scale] " +
  "hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 " +
  "bg-accent text-accent-ink data-[resolved=true]:bg-resolved data-[open=true]:scale-110";
const CARD = "z-10 rounded-lg border border-line bg-surface p-3 shadow-lg";
const TIP = "z-20 rounded-md bg-ink px-2 py-1 font-sans text-xs text-surface shadow-md";

export function PinLayer() {
  const camera = useCameraState();
  const threads = useCommentsStore((store) => store.threads);
  const draftAt = useUiStore((store) => store.draftAt);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {threads.map((thread) => (
        <Pin key={thread.id} thread={thread} at={worldToScreen(camera, thread.at)} />
      ))}
      {draftAt !== undefined && <DraftPin world={draftAt} at={worldToScreen(camera, draftAt)} />}
    </div>
  );
}

// A thread's pin, its tooltip, and the thread itself when open.
function Pin({ thread, at }: { readonly thread: ThreadModel; readonly at: Point }) {
  const isOpen = useUiStore((store) => store.openThreadId === thread.id);
  const openThread = useUiStore((store) => store.openThread);
  const closeThread = useUiStore((store) => store.closeThread);
  const now = useNow();
  const first = thread.comments[0];
  const author = first?.author ?? "";
  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => (open ? openThread(thread.id) : closeThread())}
    >
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Popover.Anchor asChild>
            <button
              type="button"
              className={PIN}
              style={{ transform: `translate(${at.x}px, ${at.y}px)` }}
              data-resolved={thread.resolved}
              data-open={isOpen}
              aria-label={`Comment by ${author}${thread.resolved ? ", resolved" : ""}`}
              onClick={() => (isOpen ? closeThread() : openThread(thread.id))}
            >
              {author.slice(0, 1).toUpperCase()}
            </button>
          </Popover.Anchor>
        </Tooltip.Trigger>
        {!isOpen && (
          <Tooltip.Portal>
            <Tooltip.Content className={TIP} side="top" sideOffset={8}>
              {author}, {first === undefined ? "" : whenWas(first.createdAt, now)}
              {thread.comments.length > 1 && `, ${thread.comments.length - 1} replies`}
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
      <Popover.Portal>
        <Popover.Content
          className={CARD}
          side="right"
          sideOffset={12}
          collisionPadding={16}
          updatePositionStrategy="always"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <Thread thread={thread} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Where a comment is about to be written: a hollow pin, and the form beside it.
function DraftPin({ world, at }: { readonly world: Point; readonly at: Point }) {
  const cancelDraft = useUiStore((store) => store.cancelDraft);
  const openThread = useUiStore((store) => store.openThread);
  const post = useCommentsStore((store) => store.openThread);
  return (
    <Popover.Root open onOpenChange={(open) => !open && cancelDraft()}>
      <Popover.Anchor asChild>
        <span
          className={`${PIN} border-accent bg-surface text-accent`}
          style={{ transform: `translate(${at.x}px, ${at.y}px)` }}
          aria-hidden="true"
        >
          +
        </span>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          className={`${CARD} w-80 max-w-[calc(100vw-2rem)]`}
          side="right"
          sideOffset={12}
          collisionPadding={16}
          updatePositionStrategy="always"
        >
          <CommentForm
            placeholder="Add a comment"
            submitLabel="Post"
            onSubmit={(text) => openThread(post(world, text))}
            onCancel={cancelDraft}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
