/**
 * ─ Canvas ─
 *
 * The host element the stage draws into, and the effect that mounts
 * it. The canvas chunk is loaded here, on demand, and mounting is
 * async after that, so the cleanup marks the effect disposed and a
 * canvas that finishes after that is torn down at once: StrictMode's
 * double mount is a real test of the teardown, not a special case.
 * A tap on the canvas reaches the comment interface through here, and
 * a right click opens the menu that places a comment where it was,
 * and, in edit mode, takes away the room drawn here under it, or the
 * rooms picked with a Ctrl click.
 */

import { ContextMenu } from "radix-ui";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { Point } from "../../camera/index.js";
import { roomAt, type HungRoom } from "../../gallery/hang.js";
import { usePlan } from "../../state/utils/plan.js";
import { useStore } from "../../state/store.js";
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
  const ui = useStore.getState();
  if (ui.mode === "comment") {
    ui.startDraft(world);
  } else {
    ui.closeThread();
    ui.cancelDraft();
  }
}

export function Canvas() {
  const { camera, view, tour, gridShown } = useCanvas();
  const mode = useStore((store) => store.mode);
  const tool = useStore((store) => store.tool);
  const startDraft = useStore((store) => store.startDraft);
  const removeRoom = useStore((store) => store.removeRoom);
  const selected = useStore((store) => store.selected);
  const removeSelected = useStore((store) => store.removeSelected);
  const plan = usePlan();
  const hostRef = useRef<HTMLDivElement>(null);
  // Where the last right click landed, in world units, for the menu's item.
  const menuAt = useRef<Point>({ x: 0, y: 0 });
  // The room under the last right click, for the item that takes a drawn one away.
  const [menuRoom, setMenuRoom] = useState<HungRoom | undefined>(undefined);

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
    setMenuRoom(roomAt(plan, menuAt.current));
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          ref={hostRef}
          data-mode={mode}
          data-tool={tool}
          className="absolute inset-0 cursor-grab touch-none select-none data-[mode=comment]:cursor-crosshair data-[mode=edit]:cursor-default data-[mode=edit]:data-[over=work]:cursor-grab data-[mode=edit]:data-[over=wall-x]:cursor-ew-resize data-[mode=edit]:data-[over=wall-y]:cursor-ns-resize data-[camera=panning]:cursor-grabbing data-[camera=moving]:cursor-grabbing data-[mode=edit]:data-[tool=room]:data-[over=plan]:cursor-crosshair data-[camera=drawing]:cursor-crosshair"
          onContextMenu={rememberMenuPoint}
        />
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className={MENU}>
          <ContextMenu.Item className={ITEM} onSelect={() => startDraft(menuAt.current)}>
            Add comment here
          </ContextMenu.Item>
          {mode === "edit" && selected.length > 0 && (
            <ContextMenu.Item className={ITEM} onSelect={() => removeSelected()}>
              {selected.length === 1
                ? "Remove the selected room"
                : `Remove the ${selected.length} selected rooms`}
            </ContextMenu.Item>
          )}
          {mode === "edit" && selected.length === 0 && menuRoom?.room.drawn === true && (
            <ContextMenu.Item className={ITEM} onSelect={() => removeRoom(menuRoom.room.id)}>
              Remove this room
            </ContextMenu.Item>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
