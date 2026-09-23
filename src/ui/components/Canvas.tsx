/**
 * ─ Canvas ─
 *
 * The host element the stage draws into, and the effect that mounts
 * it. The canvas chunk is loaded here, on demand, and mounting is
 * async after that, so the cleanup marks the effect disposed and a
 * canvas that finishes after that is torn down at once: StrictMode's
 * double mount is a real test of the teardown, not a special case.
 * A tap on the canvas reaches the comment interface through here, and
 * a right click opens the menu that places a comment where it was.
 */

import { ContextMenu } from "radix-ui";
import { useEffect, useRef, type MouseEvent } from "react";
import type { Point } from "../../camera/index.js";
import { useUiStore } from "../../comments/ui-store.js";
import { whenHydrated } from "../../storage/index.js";
import { useCanvas } from "../utils/canvas-context.js";
import { failLoader, raiseCurtain } from "../utils/curtain.js";

const MENU = "z-20 min-w-40 rounded-md border border-line bg-surface p-1 shadow-lg";
const ITEM =
  "cursor-default rounded px-2 py-1.5 font-sans text-sm text-ink outline-none " +
  "data-[highlighted]:bg-accent data-[highlighted]:text-accent-ink";

// What a tap on empty canvas does: place a draft in comment mode, and
// otherwise put away whatever is open.
function onTap(world: Point): void {
  const ui = useUiStore.getState();
  if (ui.mode === "comment") {
    ui.startDraft(world);
  } else {
    ui.closeThread();
    ui.cancelDraft();
  }
}

export function Canvas() {
  const { camera, view, tour, gridShown } = useCanvas();
  const mode = useUiStore((store) => store.mode);
  const startDraft = useUiStore((store) => store.startDraft);
  const hostRef = useRef<HTMLDivElement>(null);
  // Where the last right click landed, in world units, for the menu's item.
  const menuAt = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }
    let isDisposed = false;
    let teardown = (): void => {};
    const mount = async (): Promise<void> => {
      const { mountCanvas } = await import("../../canvas/mount.js");
      const mounted = await mountCanvas(host, camera, view, { onTap, gridShown });
      if (isDisposed) {
        mounted.dispose();
        return;
      }
      teardown = () => {
        tour.set(undefined);
        mounted.dispose();
      };
      tour.set(mounted.tour);
      // The curtain opens on the first frame of a whole gallery: the stores loaded too.
      void Promise.all([mounted.firstFrame, whenHydrated()]).then(raiseCurtain);
    };
    mount().catch((error: unknown) => {
      failLoader();
      reportError(error);
    });
    return () => {
      isDisposed = true;
      teardown();
    };
  }, [camera, view, tour, gridShown]);

  const rememberMenuPoint = (event: MouseEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    menuAt.current = camera.toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          ref={hostRef}
          data-mode={mode}
          className="absolute inset-0 cursor-grab touch-none select-none data-[camera=panning]:cursor-grabbing data-[mode=comment]:cursor-crosshair"
          onContextMenu={rememberMenuPoint}
        />
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={MENU}>
          <ContextMenu.Item className={ITEM} onSelect={() => startDraft(menuAt.current)}>
            Add comment here
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
