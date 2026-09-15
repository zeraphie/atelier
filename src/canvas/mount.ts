/**
 * ─ Mount ─
 *
 * Everything the canvas needs, put together in one place and taken
 * apart in one place. This module is the canvas chunk's door: the
 * canvas host loads it on demand, so Pixi and the stage arrive after
 * the app and evaluate on their own.
 */

import { CameraInput, glide, type Camera, type ViewSize } from "../camera/index.js";
import { hangGallery, roomAt, SPACING, workAt } from "../gallery/hang.js";
import { routeThrough } from "../gallery/route.js";
import images from "../gallery/images.json";
import { ROOMS } from "../gallery/works.js";
import { DotGrid } from "./dot-grid.js";
import { whenFacesReady } from "./faces.js";
import { GalleryLayer } from "./gallery-layer.js";
import { Stage } from "./stage.js";
import { tokenColor } from "./theme.js";
import { Tour, type TourHandle } from "./tour.js";
import type { ValueStore } from "./value-store.js";

// Screen pixels kept clear around the gallery when the view first fits it.
const FIT_PADDING = 48;
// Never open closer than life size, however small the gallery.
const FIT_ZOOM_MOST = 1;
// How long a move to a work, a room or the whole plan takes.
const GLIDE_MS = 600;

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
  view: ValueStore<ViewSize>
): Promise<MountedCanvas> {
  await whenFacesReady();
  const stage = await Stage.create(host, camera);
  const input = new CameraInput(camera, host);
  const requestFrame = (): void => stage.requestFrame();
  const ink = tokenColor("--color-ink", { rgb: 0x2b2b30, alpha: 1 });
  const muted = tokenColor("--color-muted", { rgb: 0x777a86, alpha: 1 });
  const line = tokenColor("--color-line", { rgb: 0xd9dade, alpha: 1 });
  const surface = tokenColor("--color-surface", { rgb: 0xffffff, alpha: 1 });
  const isMotionReduced = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const plan = hangGallery(ROOMS);
  const route = routeThrough(plan);
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
  camera.fit(stage.view, plan.bounds, FIT_PADDING, FIT_ZOOM_MOST);
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
    const ms = isMotionReduced() ? 0 : GLIDE_MS;
    glide(camera, camera.fitted(stage.view, target, FIT_PADDING), stage.view, ms);
  });
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
