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
 * and, in edit mode, hangs a picture of your own there, takes one down,
 * or takes away the room drawn here under it or the drawn rooms picked
 * with the Room tool.
 * Decision: DECISIONS.md, adding a comment: a button and a menu, not a bare tap.
 */

import { ContextMenu } from "radix-ui";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { pointOn, type TapModifiers } from "../../camera/index.js";
import type { Point } from "../../geometry.js";
import type { HungRoom, HungWork } from "../../gallery/layout/hang.js";
import { roomAt, workAt } from "../../gallery/layout/targets.js";
import { currentPlan, usePlan } from "../../state/utils/plan.js";
import { useStore } from "../../state/store.js";
import { whenHydrated } from "../../storage/index.js";
import { whenArrived } from "../../viewing/identity/arrival.js";
import { useCanvas } from "../utils/canvas-context.js";
import { failLoader, raiseCurtain } from "../utils/curtain.js";
import { CanvasMenu } from "./CanvasMenu.js";

// What a tap on the canvas does: with the Picture tool, ask for a picture to
// hang there; with the Room tool, pick the room under it, alone or, with Ctrl
// or Command held, beside the others; place a draft in comment mode; and
// otherwise put away whatever is open.
function onTap(world: Point, modifiers: TapModifiers): void {
  const ui = useStore.getState();
  if (ui.mode === "edit" && ui.tool === "picture") {
    // On a room's floor, and not over a picture already there: one never hangs
    // on another, and one outside every room is never drawn.
    const plan = currentPlan();
    if (roomAt(plan, world) !== undefined && workAt(plan, world) === undefined) {
      ui.askPicture(world);
    }
  } else if (ui.mode === "edit" && ui.tool === "room") {
    const room = roomAt(currentPlan(), world);
    if (room === undefined) {
      ui.clearSelection();
    } else if (modifiers.ctrlKey || modifiers.metaKey) {
      ui.toggleSelected(room.room.id);
    } else {
      ui.selectOnly(room.room.id);
    }
  } else if (ui.mode === "comment") {
    ui.startDraft(world);
  } else {
    ui.closeThread();
    ui.cancelDraft();
  }
}

export function Canvas() {
  const { camera, canvasSize, tour, gridShown, pointer } = useCanvas();
  const mode = useStore((store) => store.mode);
  const tool = useStore((store) => store.tool);
  const plan = usePlan();
  const hostRef = useRef<HTMLDivElement>(null);
  // Where the last right click landed, in world units, for the menu's item.
  const menuAt = useRef<Point>({ x: 0, y: 0 });
  // The room under the last right click, for the item that takes a drawn one away.
  const [menuRoom, setMenuRoom] = useState<HungRoom | undefined>(undefined);
  // The work under it, for the item that takes a picture of your own down.
  const [menuWork, setMenuWork] = useState<HungWork | undefined>(undefined);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }
    let isDisposed = false;
    let teardown = (): void => {};
    const mount = async (): Promise<void> => {
      const { mountCanvas } = await import("../../canvas/mount.js");
      const mounted = await mountCanvas(host, camera, canvasSize, { onTap, gridShown, pointer });
      if (isDisposed) {
        mounted.dispose();
        return;
      }
      teardown = () => {
        tour.set(undefined);
        mounted.dispose();
      };
      tour.set(mounted.tour);
      // The curtain opens on the first frame of a whole gallery: the stores loaded, and the
      // person come in to their viewing.
      void Promise.all([mounted.firstFrame, whenHydrated(), whenArrived()]).then(raiseCurtain);
    };
    mount().catch((error: unknown) => {
      failLoader();
      reportError(error);
    });
    return () => {
      isDisposed = true;
      teardown();
    };
  }, [camera, canvasSize, tour, gridShown, pointer]);

  const rememberMenuPoint = (event: MouseEvent<HTMLDivElement>): void => {
    menuAt.current = camera.toWorld(pointOn(event.currentTarget, event));
    setMenuRoom(roomAt(plan, menuAt.current));
    setMenuWork(workAt(plan, menuAt.current));
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div
          ref={hostRef}
          data-mode={mode}
          data-tool={tool}
          className="absolute inset-0 cursor-grab touch-none select-none data-[mode=comment]:cursor-crosshair data-[mode=edit]:cursor-default data-[mode=edit]:data-[over=work]:cursor-grab data-[mode=edit]:data-[over=corner-nwse]:cursor-nwse-resize data-[mode=edit]:data-[over=corner-nesw]:cursor-nesw-resize data-[mode=edit]:data-[over=wall-x]:cursor-ew-resize data-[mode=edit]:data-[over=wall-y]:cursor-ns-resize data-[camera=panning]:cursor-grabbing data-[camera=moving]:cursor-grabbing data-[mode=edit]:data-[tool=room]:data-[over=plan]:cursor-crosshair data-[mode=edit]:data-[tool=picture]:data-[over=room]:cursor-crosshair data-[camera=drawing]:cursor-crosshair data-[mode=edit]:data-[tool=door]:data-[over=edge]:cursor-pointer"
          onContextMenu={rememberMenuPoint}
        />
      </ContextMenu.Trigger>
      <CanvasMenu at={() => menuAt.current} room={menuRoom} work={menuWork} />
    </ContextMenu.Root>
  );
}
