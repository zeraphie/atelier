/**
 * ─ Mount ─
 *
 * Everything the canvas needs, put together in one place and taken
 * apart in one place. This module is the canvas chunk's door: the
 * canvas host loads it on demand, so Pixi and the stage arrive after
 * the app and evaluate on their own.
 */

import { CameraInput, type Camera, type ViewSize } from "../camera/index.js";
import { DotGrid } from "./dot-grid.js";
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

/** Put a stage on `host` that follows `camera`, bind the input to it, and hang the wall over the grid. */
export async function mountCanvas(
  host: HTMLElement,
  camera: Camera,
  view: ValueStore<ViewSize>
): Promise<MountedCanvas> {
  await whenFacesReady();
  const stage = await Stage.create(host, camera);
  const input = new CameraInput(camera, host);
  const wall = standInWall(stage.world, tokenColor("--color-ink", { rgb: 0x2b2b30, alpha: 1 }));
  camera.fit(stage.view, wall.bounds, FIT_PADDING, FIT_ZOOM_MOST);
  // Made after the fit, so its first cell is drawn for the zoom the view opens at.
  const grid = new DotGrid(
    stage.app.renderer,
    stage.app.stage,
    {
      crossing: { ...tokenColor("--color-muted", { rgb: 0x777a86, alpha: 1 }), alpha: 0.85 },
      line: { ...tokenColor("--color-muted", { rgb: 0x777a86, alpha: 1 }), alpha: 0.4 },
    },
    () => stage.requestFrame(),
    camera.current,
    stage.view
  );
  const stopFollowing = camera.onChange((state) => grid.follow(state));
  const stopResize = stage.onResize(() => {
    view.set(stage.view);
    grid.resize(stage.view);
  });
  view.set(stage.view);
  return {
    firstFrame: stage.firstFrame,
    dispose() {
      stopResize();
      stopFollowing();
      grid.destroy();
      wall.dispose();
      input.dispose();
      stage.destroy();
    },
  };
}
