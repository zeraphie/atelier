/**
 * ─ Mount ─
 *
 * Everything the canvas needs, put together in one place and taken
 * apart in one place. This module is the canvas chunk's door: the
 * canvas host loads it on demand, so Pixi and the stage arrive after
 * the app and evaluate on their own, as one short stall in the
 * loader's loop rather than a long one before it.
 */

import { CameraInput, type Camera, type ViewSize } from "../camera/index.js";
import { whenFacesReady } from "./faces.js";
import { standInWall } from "./placeholder.js";
import { Stage } from "./stage.js";
import { tokenColor } from "./theme.js";
import type { ValueStore } from "./value-store.js";

// Screen pixels kept clear around the wall when the view first fits it.
const FIT_PADDING = 48;
// Never open closer than life size, however small the wall.
const FIT_ZOOM_MOST = 1;

export interface MountedCanvas {
  /** Resolves once the stage has drawn its first frame. */
  readonly firstFrame: Promise<void>;
  dispose(): void;
}

/** Put a stage on `host` that follows `camera`, bind the input to it, and hang the wall. */
export async function mountCanvas(
  host: HTMLElement,
  camera: Camera,
  view: ValueStore<ViewSize>
): Promise<MountedCanvas> {
  await whenFacesReady();
  const stage = await Stage.create(host, camera);
  const input = new CameraInput(camera, host);
  const stopResize = stage.onResize(() => view.set(stage.view));
  view.set(stage.view);
  const wall = standInWall(stage.world, tokenColor("--color-ink", { rgb: 0x2b2b30, alpha: 1 }));
  camera.fit(stage.view, wall.bounds, FIT_PADDING, FIT_ZOOM_MOST);
  return {
    firstFrame: stage.firstFrame,
    dispose() {
      wall.dispose();
      stopResize();
      input.dispose();
      stage.destroy();
    },
  };
}
