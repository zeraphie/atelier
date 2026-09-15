/**
 * ─ Comment events ─
 *
 * Every change to the comments is an event, and the state is what the
 * events add up to. The store makes an event for each action and
 * applies it here; a peer's event arrives and is applied the same way;
 * saving and loading keep the state the events built. An event that
 * names a thread or comment that is not there, or one already applied,
 * changes nothing, so the same event can arrive twice without harm.
 * Decision: DECISIONS.md, state: zustand, with events as the unit of change.
 */

import type { Point } from "../geometry.js";
import type { Comment, CommentsState, Thread } from "./model.js";

export type CommentEvent =
  | {
      readonly type: "opened";
      readonly threadId: string;
      readonly at: Point;
      readonly comment: Comment;
    }
  | { readonly type: "replied"; readonly threadId: string; readonly comment: Comment }
  | {
      readonly type: "edited";
      readonly threadId: string;
      readonly commentId: string;
      readonly text: string;
      readonly at: number;
    }
  | { readonly type: "resolved"; readonly threadId: string; readonly resolved: boolean };

/** The state after `event`; the same state when the event changes nothing. */
export function applyEvent(state: CommentsState, event: CommentEvent): CommentsState {
  switch (event.type) {
    case "opened": {
      if (state.threads.some((thread) => thread.id === event.threadId)) {
        return state;
      }
      const thread: Thread = {
        id: event.threadId,
        at: event.at,
        comments: [event.comment],
        resolved: false,
      };
      return { threads: [...state.threads, thread] };
    }
    case "replied":
      return update(state, event.threadId, (thread) =>
        thread.comments.some((comment) => comment.id === event.comment.id)
          ? thread
          : { ...thread, comments: [...thread.comments, event.comment] }
      );
    case "edited":
      return update(state, event.threadId, (thread) => {
        const index = thread.comments.findIndex((comment) => comment.id === event.commentId);
        const comment = thread.comments[index];
        if (
          comment === undefined ||
          (comment.text === event.text && comment.editedAt === event.at)
        ) {
          return thread;
        }
        const comments = [...thread.comments];
        comments[index] = { ...comment, text: event.text, editedAt: event.at };
        return { ...thread, comments };
      });
    case "resolved":
      return update(state, event.threadId, (thread) =>
        thread.resolved === event.resolved ? thread : { ...thread, resolved: event.resolved }
      );
  }
}

// One thread changed by `change`, the rest as they were; the same state
// when the thread is not there or comes back unchanged.
function update(
  state: CommentsState,
  threadId: string,
  change: (thread: Thread) => Thread
): CommentsState {
  const index = state.threads.findIndex((thread) => thread.id === threadId);
  const before = state.threads[index];
  if (before === undefined) {
    return state;
  }
  const after = change(before);
  if (after === before) {
    return state;
  }
  const threads = [...state.threads];
  threads[index] = after;
  return { threads };
}
