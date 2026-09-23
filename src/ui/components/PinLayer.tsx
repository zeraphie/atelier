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
import { worldToScreen, type Point } from "../../camera/index.js";
import type { Thread as ThreadModel } from "../../comments/model.js";
import { useStore } from "../../state/store.js";
import { whenWas } from "../../comments/when.js";
import { CARD } from "../atoms/Card.js";
import { Placed } from "../atoms/Placed.js";
import { Tip } from "../atoms/Tip.js";
import { CommentForm } from "../molecules/CommentForm.js";
import { useCameraState } from "../utils/canvas-context.js";
import { useNow } from "../utils/use-now.js";
import { Thread } from "./Thread.js";

const PIN =
  "pointer-events-auto flex size-7 items-center justify-center " +
  "rounded-full border-2 border-surface font-sans text-xs font-bold shadow-md transition-[scale] " +
  "hover:scale-110 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 " +
  "bg-accent text-accent-ink data-[resolved=true]:bg-resolved data-[open=true]:scale-110";
const POPOVER = `${CARD} z-10 p-3`;

export function PinLayer() {
  const camera = useCameraState();
  const threads = useStore((store) => store.threads);
  const draftAt = useStore((store) => store.draftAt);
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
  const isOpen = useStore((store) => store.openThreadId === thread.id);
  const showThread = useStore((store) => store.showThread);
  const closeThread = useStore((store) => store.closeThread);
  const now = useNow();
  const first = thread.comments[0];
  const author = first?.author ?? "";
  return (
    <Placed at={at}>
      <Popover.Root
        open={isOpen}
        onOpenChange={(open) => (open ? showThread(thread.id) : closeThread())}
      >
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Popover.Anchor asChild>
              <button
                type="button"
                className={PIN}
                data-resolved={thread.resolved}
                data-open={isOpen}
                aria-label={`Comment by ${author}${thread.resolved ? ", resolved" : ""}`}
                onClick={() => (isOpen ? closeThread() : showThread(thread.id))}
              >
                {author.slice(0, 1).toUpperCase()}
              </button>
            </Popover.Anchor>
          </Tooltip.Trigger>
          {!isOpen && (
            <Tip>
              {author}, {first === undefined ? "" : whenWas(first.createdAt, now)}
              {thread.comments.length > 1 && `, ${thread.comments.length - 1} replies`}
            </Tip>
          )}
        </Tooltip.Root>
        <Popover.Portal>
          <Popover.Content
            className={POPOVER}
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
    </Placed>
  );
}

// Where a comment is about to be written: a hollow pin, and the form beside it.
function DraftPin({ world, at }: { readonly world: Point; readonly at: Point }) {
  const cancelDraft = useStore((store) => store.cancelDraft);
  const showThread = useStore((store) => store.showThread);
  const post = useStore((store) => store.openThread);
  return (
    <Placed at={at}>
      <Popover.Root open onOpenChange={(open) => !open && cancelDraft()}>
        <Popover.Anchor asChild>
          <span className={`${PIN} border-accent bg-surface text-accent`} aria-hidden="true">
            +
          </span>
        </Popover.Anchor>
        <Popover.Portal>
          <Popover.Content
            className={`${POPOVER} w-80 max-w-[calc(100vw-2rem)]`}
            side="right"
            sideOffset={12}
            collisionPadding={16}
            updatePositionStrategy="always"
          >
            <CommentForm
              placeholder="Add a comment"
              submitLabel="Post"
              onSubmit={(text) => showThread(post(world, text))}
              onCancel={cancelDraft}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </Placed>
  );
}
