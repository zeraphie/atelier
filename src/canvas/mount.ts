/**
 * ─ Mount ─
 *
 * Everything the canvas needs, put together in one place and taken
 * apart in one place. This module is the canvas chunk's door: the
 * canvas host loads it on demand, so Pixi and the stage arrive after
 * the app and evaluate on their own.
 */

import {
  CameraInput,
  FIT_PADDING,
  isMotionReduced,
  moveTo,
  type Camera,
  type Point,
  type ViewSize,
} from "../camera/index.js";
import { roomAt, SPACING, workAt } from "../gallery/hang.js";
import images from "../gallery/images.json";
import { PLAN, ROUTE } from "../gallery/plan.js";
import { DotGrid } from "./dot-grid.js";
import { whenFacesReady } from "./faces.js";
import { GalleryLayer } from "./gallery-layer.js";
import { Stage } from "./stage.js";
import { tokenColor } from "./theme.js";
import { Tour, type TourHandle } from "./tour.js";
import type { ValueStore } from "./value-store.js";

export interface MountHooks {
  /** A tap on empty canvas, as a world point. */
  readonly onTap: (world: Point) => void;
  /** Whether the grid is drawn, as the interface switches it. */
  readonly gridShown: ValueStore<boolean>;
}

export interface MountedCanvas {
  /** Resolves once the stage has drawn its first frame. */
  readonly firstFrame: Promise<void>;
  /** The walk along the route. */
  readonly tour: TourHandle;
  dispose(): void;
}

/** Put a stage on `host` that follows `camera`, bind the input to it, and hang the gallery over the grid. */
export async function mountCanvas(
  host: HTMLElement,
  camera: Camera,
  view: ValueStore<ViewSize>,
  hooks: MountHooks
): Promise<MountedCanvas> {
  await whenFacesReady();
  const stage = await Stage.create(host, camera);
  const input = new CameraInput(camera, host);
  const requestFrame = (): void => stage.requestFrame();
  const ink = tokenColor("--color-ink", { rgb: 0x2b2b30, alpha: 1 });
  const muted = tokenColor("--color-muted", { rgb: 0x777a86, alpha: 1 });
  const line = tokenColor("--color-line", { rgb: 0xd9dade, alpha: 1 });
  const surface = tokenColor("--color-surface", { rgb: 0xffffff, alpha: 1 });
  const plan = PLAN;
  const route = ROUTE;
  const gallery = new GalleryLayer(
    stage.world,
    plan,
    SPACING.wallCm,
    images,
    {
      room: { floor: { ...surface, alpha: 0.85 }, name: muted },
      wall: { ...ink, alpha: 0.9 },
      work: { edge: line, card: surface, ink, muted },
    },
    requestFrame
  );
  const tour = new Tour({
    camera,
    route,
    view: () => stage.view,
    extentOf: (stop) => gallery.extentOf(stop.work),
    fitPadding: FIT_PADDING,
    isMotionReduced,
  });
  // The view opens on the first room, the Foyer, with the way on in sight.
  const first = plan.rooms[0];
  camera.fit(stage.view, first === undefined ? plan.bounds : first.rect, FIT_PADDING);
  gallery.follow(camera.current);
  // Made after the fit, so its first cell is drawn for the zoom the view opens at.
  const grid = new DotGrid(
    stage.app.renderer,
    stage.app.stage,
    { crossing: muted, line: { ...muted, alpha: 0.6 } },
    requestFrame,
    camera.current,
    stage.view
  );
  const stopFollowing = camera.onChange((state) => {
    grid.follow(state);
    gallery.follow(state);
  });
  // A double tap fills the view with what is under it: a work with its
  // label, joining the tour there, else its room, else the whole plan.
  // Reduced motion jumps instead of gliding.
  const stopDoubleTap = input.onDoubleTap((at) => {
    const point = camera.toWorld(at);
    const work = workAt(plan, point);
    if (work !== undefined) {
      tour.enterAt(work.work.id);
    }
    const target =
      work === undefined ? (roomAt(plan, point)?.rect ?? plan.bounds) : gallery.extentOf(work);
    moveTo(camera, camera.fitted(stage.view, target, FIT_PADDING), stage.view);
  });
  const stopTap = input.onTap((at) => hooks.onTap(camera.toWorld(at)));
  const stopGridSwitch = hooks.gridShown.subscribe((isShown) => grid.show(isShown));
  grid.show(hooks.gridShown.current);
  const stopResize = stage.onResize(() => {
    view.set(stage.view);
    grid.resize(stage.view);
  });
  view.set(stage.view);
  return {
    firstFrame: stage.firstFrame,
    tour,
    dispose() {
      tour.dispose();
      stopGridSwitch();
      stopTap();
      stopDoubleTap();
      stopResize();
      stopFollowing();
      grid.destroy();
      gallery.destroy();
      input.dispose();
      stage.destroy();
    },
  };
}
