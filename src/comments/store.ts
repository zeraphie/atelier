/**
 * ─ Comment store ─
 *
 * The comments as React reads them, with the actions a person takes.
 * Each action makes one event, applies it through the reducers, and
 * tells the event listeners, which is how a shared room hears of it;
 * an event from elsewhere is applied without being told again. The
 * threads and the person's name persist in this browser's database, so a
 * reload keeps them; the store joins the roll call the curtain waits on.
 * Decision: DECISIONS.md, persistence; who is commenting.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Point } from "../geometry.js";
import { hydration, stateStorage } from "../storage/index.js";
import { applyEvent, type CommentEvent } from "./events.js";
import type { CommentsState } from "./model.js";

export interface CommentsStore extends CommentsState {
  /** Who this browser comments as. */
  readonly author: string;
  setAuthor(author: string): void;
  /** Open a thread at a world point with its first comment; returns the thread's id. */
  openThread(at: Point, text: string): string;
  reply(threadId: string, text: string): void;
  edit(threadId: string, commentId: string, text: string): void;
  resolve(threadId: string, resolved: boolean): void;
  /** Apply an event from elsewhere, such as a peer, without telling the listeners. */
  applyRemote(event: CommentEvent): void;
}

type EventListener = (event: CommentEvent) => void;

const listeners = new Set<EventListener>();

/** Hear every event this browser makes; returns the unsubscribe function. */
export function onCommentEvent(listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// A name to comment under until the person types their own.
function visitorName(): string {
  return `Visitor ${Math.floor(100 + Math.random() * 900)}`;
}

hydration.expect("comments");

export const useCommentsStore = create<CommentsStore>()(
  persist(
    (set, get) => {
      const dispatch = (event: CommentEvent): void => {
        set((state) => applyEvent(state, event));
        for (const listener of listeners) {
          listener(event);
        }
      };
      return {
        threads: [],
        author: visitorName(),
        setAuthor: (author) => {
          set({ author: author.trim() || visitorName() });
        },
        openThread: (at, text) => {
          const threadId = crypto.randomUUID();
          dispatch({
            type: "opened",
            threadId,
            at,
            comment: { id: crypto.randomUUID(), author: get().author, text, createdAt: Date.now() },
          });
          return threadId;
        },
        reply: (threadId, text) => {
          dispatch({
            type: "replied",
            threadId,
            comment: { id: crypto.randomUUID(), author: get().author, text, createdAt: Date.now() },
          });
        },
        edit: (threadId, commentId, text) => {
          dispatch({ type: "edited", threadId, commentId, text, at: Date.now() });
        },
        resolve: (threadId, resolved) => {
          dispatch({ type: "resolved", threadId, resolved });
        },
        applyRemote: (event) => {
          set((state) => applyEvent(state, event));
        },
      };
    },
    {
      name: "atelier.comments",
      version: 1,
      storage: createJSONStorage(() => stateStorage),
      partialize: (state) => ({ threads: state.threads, author: state.author }),
      // Loaded, or failed to load and carrying on empty: either way the curtain may open.
      onRehydrateStorage: () => (_state, error) => {
        if (error !== undefined) {
          reportError(error);
        }
        hydration.loaded("comments");
      },
    }
  )
);
