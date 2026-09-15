/**
 * ─ Shortcuts ─
 *
 * The keys the interface answers to, listened for on the window so
 * they work wherever focus is, except inside something being typed
 * in, and except a key something nearer has already answered, as a
 * popover answers Escape. C makes the next tap place a comment;
 * Escape backs out of whatever is furthest forward: a draft, an open
 * thread, comment mode, then the tour. The arrows step along the
 * tour and Shift+1 fits the plan, as the design tools have it.
 */

import { useEffect } from "react";
import { FIT_PADDING, LIFE_SIZE, moveTo } from "../camera/index.js";
import { useUiStore } from "../comments/ui-store.js";
import { PLAN } from "../gallery/plan.js";
import { useCanvas } from "./canvas-context.js";
import { keyActionFor } from "./keys.js";

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

export function useShortcuts(): void {
  const { camera, view, tour } = useCanvas();
  useEffect(() => {
    const escape = (): void => {
      const ui = useUiStore.getState();
      if (ui.draftAt !== undefined) {
        ui.cancelDraft();
      } else if (ui.openThreadId !== undefined) {
        ui.closeThread();
      } else if (ui.mode === "comment") {
        ui.setMode("browse");
      } else if (tour.current !== undefined && tour.current.stop.current >= 0) {
        tour.current.leave();
      }
    };
    const stepOn = (): void => {
      const walk = tour.current;
      if (walk === undefined) {
        return;
      }
      if (walk.stop.current < 0) {
        walk.start();
      } else {
        walk.next();
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || isTyping(event.target)) {
        return;
      }
      const action = keyActionFor(event);
      if (action === undefined) {
        return;
      }
      event.preventDefault();
      const ui = useUiStore.getState();
      switch (action) {
        case "comment":
          ui.setMode(ui.mode === "comment" ? "browse" : "comment");
          break;
        case "escape":
          escape();
          break;
        case "next":
          stepOn();
          break;
        case "previous":
          tour.current?.previous();
          break;
        case "fit":
          moveTo(
            camera,
            camera.fitted(view.current, PLAN.bounds, FIT_PADDING, LIFE_SIZE),
            view.current
          );
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [camera, view, tour]);
}
