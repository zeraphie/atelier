/**
 * ─ Comments slice ─
 *
 * The threads, and what the comment interface is doing right now: a
 * draft waiting to be written, and which thread is open. A person's
 * actions make records and put them in; the put actions are the ones
 * a shared room replays, since a record carries its own ids, author
 * and time. Putting a record twice changes nothing.
 * Decision: DECISIONS.md, threads: a root and its replies.
 */

import type { Point } from "../geometry.js";
import type { Get, Set, SliceContext } from "../state/actions.js";
import { stamp, type When } from "../state/stamped.js";
import type { Store } from "../state/store.js";
import type { Comment, Thread } from "./model.js";

export interface CommentsSlice {
  readonly threads: readonly Thread[];
  /** Where a comment is being written, in world units, if one is. */
  readonly draftAt: Point | undefined;
  readonly openThreadId: string | undefined;
  /** A thread as a record: added unless one with its id is there. */
  putThread(thread: Thread, when?: When): void;
  /** A reply as a record: added to its thread unless one with its id is there. */
  putComment(threadId: string, comment: Comment, when?: When): void;
  setText(threadId: string, commentId: string, text: string, editedAt: number, when?: When): void;
  setResolved(threadId: string, resolved: boolean, when?: When): void;
  /** Open a thread here with its first comment, as this person; returns the thread's id. */
  openThread(at: Point, text: string): string;
  reply(threadId: string, text: string): void;
  edit(threadId: string, commentId: string, text: string): void;
  resolve(threadId: string, resolved: boolean): void;
  /** Begin a comment at a world point; closes any thread and leaves whatever mode is on. */
  startDraft(at: Point): void;
  cancelDraft(): void;
  showThread(id: string): void;
  closeThread(): void;
}

export const createCommentsSlice =
  (context: SliceContext) =>
  (set: Set<Store>, get: Get<Store>): CommentsSlice => {
    const change = (threadId: string, by: (thread: Thread) => Thread): void => {
      set((state) => ({
        threads: state.threads.map((thread) => (thread.id === threadId ? by(thread) : thread)),
      }));
    };
    return {
      threads: [],
      draftAt: undefined,
      openThreadId: undefined,

      putThread: (thread, when) => {
        const { at, remote } = stamp(when);
        if (get().threads.some((known) => known.id === thread.id)) {
          return;
        }
        set((state) => ({ threads: [...state.threads, thread] }));
        if (!remote) {
          context.tell({ action: "putThread", args: [thread], at });
        }
      },
      putComment: (threadId, comment, when) => {
        const { at, remote } = stamp(when);
        const thread = get().threads.find((known) => known.id === threadId);
        if (thread === undefined || thread.comments.some((known) => known.id === comment.id)) {
          return;
        }
        change(threadId, (known) => ({ ...known, comments: [...known.comments, comment] }));
        if (!remote) {
          context.tell({ action: "putComment", args: [threadId, comment], at });
        }
      },
      setText: (threadId, commentId, text, editedAt, when) => {
        const { at, remote } = stamp(when);
        const thread = get().threads.find((known) => known.id === threadId);
        const comment = thread?.comments.find((known) => known.id === commentId);
        // The later edit stands; one for a comment that is not there is nothing.
        if (comment === undefined || (comment.editedAt ?? 0) >= editedAt) {
          return;
        }
        change(threadId, (known) => ({
          ...known,
          comments: known.comments.map((c) => (c.id === commentId ? { ...c, text, editedAt } : c)),
        }));
        if (!remote) {
          context.tell({ action: "setText", args: [threadId, commentId, text, editedAt], at });
        }
      },
      setResolved: (threadId, resolved, when) => {
        const { at, remote } = stamp(when);
        const thread = get().threads.find((known) => known.id === threadId);
        if (thread === undefined || thread.resolved === resolved) {
          return;
        }
        change(threadId, (known) => ({ ...known, resolved }));
        if (!remote) {
          context.tell({ action: "setResolved", args: [threadId, resolved], at });
        }
      },

      openThread: (at, text) => {
        const thread: Thread = {
          id: crypto.randomUUID(),
          at,
          comments: [
            { id: crypto.randomUUID(), author: context.who(), text, createdAt: Date.now() },
          ],
          resolved: false,
        };
        get().putThread(thread);
        return thread.id;
      },
      reply: (threadId, text) => {
        get().putComment(threadId, {
          id: crypto.randomUUID(),
          author: context.who(),
          text,
          createdAt: Date.now(),
        });
      },
      edit: (threadId, commentId, text) => {
        get().setText(threadId, commentId, text, Date.now());
      },
      resolve: (threadId, resolved) => {
        get().setResolved(threadId, resolved);
      },

      startDraft: (at) => {
        set({ draftAt: at, openThreadId: undefined, mode: "browse" });
      },
      cancelDraft: () => {
        set({ draftAt: undefined });
      },
      showThread: (id) => {
        set({ openThreadId: id, draftAt: undefined });
      },
      closeThread: () => {
        set({ openThreadId: undefined });
      },
    };
  };
