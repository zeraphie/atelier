/**
 * ─ Mount ─
 *
 * Everything the canvas needs, put together in one place and taken
 * apart in one place. This module is the canvas chunk's door: the
 * canvas host loads it on demand, so Pixi and the stage arrive after
 * the app and evaluate on their own. The plan is read from the store
 * and the gallery layer drawn again whenever it changes, so an edit
 * here or from a peer is on the canvas at once.
 */

import {
  CameraInput,
  FIT_PADDING,
  isMotionReduced,
  moveTo,
  PointerSession,
  type Camera,
  type Point,
  type ViewSize,
  type WorldRect,
} from "../camera/index.js";
import { SPACING, type Plan } from "../gallery/hang.js";
import images from "../gallery/images.json";
import { targetAt, type Target } from "../gallery/targets.js";
import { currentPlan, currentRoute, onPlanChange } from "../state/plan.js";
import { useStore } from "../state/store.js";
import { DotGrid } from "./dot-grid.js";
import { whenFacesReady } from "./faces.js";
import { GalleryLayer, type GalleryColors } from "./gallery-layer.js";
import { MoveTool } from "./move-tool.js";
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
  const accent = tokenColor("--color-accent", { rgb: 0x3b5bdb, alpha: 1 });
  const colors: GalleryColors = {
    room: { floor: { ...surface, alpha: 0.85 }, name: muted },
    wall: { ...ink, alpha: 0.9 },
    work: { edge: line, card: surface, ink, muted },
    outline: accent,
  };
  const layerOf = (plan: Plan): GalleryLayer =>
    new GalleryLayer(stage.world, plan, SPACING.wallCm, images, colors, requestFrame);
  let gallery = layerOf(currentPlan());
  const tour = new Tour({
    camera,
    route: currentRoute,
    view: () => stage.view,
    extentOf: (stop) => gallery.extentOf(stop.work),
    fitPadding: FIT_PADDING,
    isMotionReduced,
  });
  // The view opens on the first room, the Foyer, with the way on in sight.
  const first = currentPlan().rooms[0];
  camera.fit(stage.view, first === undefined ? currentPlan().bounds : first.rect, FIT_PADDING);
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
  // A new plan, from an edit here or elsewhere: the layer is drawn again from
  // it. Textures are cached by their url, so a rebuild costs little.
  const stopPlan = onPlanChange((plan) => {
    gallery.destroy();
    gallery = layerOf(plan);
    gallery.follow(camera.current);
    requestFrame();
  });
  // A double tap fills the view with what is under it: a work with its
  // label, joining the tour there, else its room, else the whole plan.
  // Reduced motion jumps instead of gliding.
  const rectOf = (target: Target): WorldRect => {
    if (target.kind === "work") {
      return gallery.extentOf(target.work);
    }
    return target.kind === "room" ? target.room.rect : currentPlan().bounds;
  };
  const stopDoubleTap = input.onDoubleTap((at) => {
    const target = targetAt(currentPlan(), camera.toWorld(at));
    if (target.kind === "work") {
      tour.enterAt(target.work.work.id);
    }
    moveTo(camera, camera.fitted(stage.view, rectOf(target), FIT_PADDING), stage.view);
  });
  // Under a pointer at rest, the same target is shown, so what lights up is
  // what a double tap would fill the view with. A held pointer is panning,
  // and the world under it is moving, so it shows nothing.
  const onHover = (event: PointerEvent): void => {
    if (event.buttons !== 0) {
      return;
    }
    const rect = host.getBoundingClientRect();
    const at = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const target = targetAt(currentPlan(), camera.toWorld(at));
    gallery.highlight(target);
    // What is under the pointer, for the cursor to say what a press would take.
    host.dataset["over"] = target.kind;
  };
  const onLeave = (): void => {
    gallery.highlight(undefined);
    delete host.dataset["over"];
  };
  // In edit mode with Move held, a press on a picture is the tool's and drags
  // it; any other press falls through to the camera. The session lives on
  // the canvas element, under the host, so a press it takes never starts a pan.
  const moving = new PointerSession(
    stage.app.canvas,
    (at) => camera.toWorld(at),
    new MoveTool({
      plan: currentPlan,
      nudge: (id, centre) => gallery.nudge(id, centre),
      move: (id, centre) => useStore.getState().moveWork(id, centre),
      host,
    })
  );
  const isMoving = (): boolean => {
    const { mode, tool } = useStore.getState();
    return mode === "edit" && tool === "move";
  };
  const stopTools = useStore.subscribe(() => moving.setActive(isMoving()));
  moving.setActive(isMoving());
  host.addEventListener("pointermove", onHover);
  host.addEventListener("pointerleave", onLeave);
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
      host.removeEventListener("pointermove", onHover);
      host.removeEventListener("pointerleave", onLeave);
      stopTools();
      moving.dispose();
      stopPlan();
      stopResize();
      stopFollowing();
      grid.destroy();
      gallery.destroy();
      input.dispose();
      stage.destroy();
    },
  };
}
