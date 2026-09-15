/**
 * ─ Shortcuts ─
 *
 * The keys the interface answers to, listened for on the window so
 * they work wherever focus is, except inside something being typed
 * in. C makes the next tap place a comment; Escape backs out of
 * whatever is furthest forward: a draft, then an open thread, then
 * comment mode.
 */

import { useEffect } from "react";
import { useUiStore } from "../comments/ui-store.js";

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function useShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTyping(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const ui = useUiStore.getState();
      if (event.key === "c" || event.key === "C") {
        ui.setMode(ui.mode === "comment" ? "browse" : "comment");
      } else if (event.key === "Escape") {
        if (ui.draftAt !== undefined) {
          ui.cancelDraft();
        } else if (ui.openThreadId !== undefined) {
          ui.closeThread();
        } else if (ui.mode === "comment") {
          ui.setMode("browse");
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
