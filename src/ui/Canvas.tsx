/**
 * ─ Canvas ─
 *
 * The host element the stage draws into, and the effect that mounts
 * it. Mounting is async, so the cleanup marks the effect disposed and
 * a stage that finishes after that is torn down at once: StrictMode's
 * double mount is a real test of the teardown, not a special case.
 */

import { useEffect, useRef } from "react";
import { CameraInput, type Camera, type ViewSize } from "../camera/index.js";
import { whenFacesReady } from "../canvas/faces.js";
import { standInWall } from "../canvas/placeholder.js";
import { Stage } from "../canvas/stage.js";
import { tokenColor } from "../canvas/theme.js";
import type { ValueStore } from "../canvas/value-store.js";
import { useCanvas } from "./canvas-context.js";
import { raiseCurtain } from "./curtain.js";

// Screen pixels kept clear around the wall when the view first fits it.
const FIT_PADDING = 48;
// Never open closer than life size, however small the wall.
const FIT_ZOOM_MOST = 1;

export function Canvas() {
  const { world, camera, view } = useCanvas();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }
    let isDisposed = false;
    let teardown = (): void => {};
    void mount(host, world, camera, view).then((dispose) => {
      if (isDisposed) {
        dispose();
      } else {
        teardown = dispose;
      }
    });
    return () => {
      isDisposed = true;
      teardown();
    };
  }, [world, camera, view]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 cursor-grab touch-none select-none data-[camera=panning]:cursor-grabbing"
    />
  );
}

/** Put a stage on `host` over `world`, bind the camera to it, and return the teardown. */
async function mount(
  host: HTMLElement,
  world: Parameters<typeof Stage.create>[1],
  camera: Camera,
  view: ValueStore<ViewSize>
): Promise<() => void> {
  await whenFacesReady();
  const stage = await Stage.create(host, world);
  const input = new CameraInput(camera, host);
  const stopFrames = camera.onChange(() => stage.requestFrame());
  const stopResize = stage.onResize(() => view.set(stage.view));
  view.set(stage.view);
  const wall = standInWall(world, tokenColor("--color-ink", { rgb: 0x2b2b30, alpha: 1 }));
  camera.fit(stage.view, wall.bounds, FIT_PADDING, FIT_ZOOM_MOST);
  void stage.firstFrame.then(raiseCurtain);
  return () => {
    wall.dispose();
    stopResize();
    stopFrames();
    input.dispose();
    stage.destroy();
  };
}
