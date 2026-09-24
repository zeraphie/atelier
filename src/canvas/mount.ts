/**
 * ─ Mount ─
 *
 * Everything the canvas needs, put together in one place and taken
 * apart in one place. This module is the canvas chunk's door: the
 * canvas host loads it on demand, so Pixi and the stage arrive after
 * the app and evaluate on their own. The plan is read from the store
 * and the gallery layer drawn again whenever it changes, so an edit
 * here or from a peer is on the canvas at once. The edit tools are
 * wired in tools/edit-tools.ts and taken apart with the rest.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import {
  CameraInput,
  FIT_PADDING,
  isMotionReduced,
  moveTo,
  pointOn,
  type Camera,
  type TapModifiers,
  type CanvasSize,
} from "../camera/index.js";
import type { Point, WorldRect } from "../geometry.js";
import { SPACING, type Plan } from "../gallery/layout/hang.js";
import images from "../gallery/images.json";
import { targetAt, type Target } from "../gallery/layout/targets.js";
import { currentPlan, currentRoute, onPlanChange } from "../state/utils/plan.js";
import { useOwnStore } from "../state/own-store.js";
import { useStore } from "../state/store.js";
import { DotGrid } from "./views/dot-grid.js";
import { whenFacesReady } from "./theme/faces.js";
import { GalleryLayer, type GalleryColors } from "./views/gallery-layer.js";
import { Stage } from "./stage.js";
import { tokenColor } from "./theme/theme.js";
import { mountEditTools } from "./tools/edit-tools.js";
import { Tour, type TourHandle } from "./tour.js";
import type { ValueStore } from "./value-store.js";

export interface MountHooks {
  /** A tap on empty canvas, as a world point, with the keys held. */
  readonly onTap: (world: Point, modifiers: TapModifiers) => void;
  /** Whether the grid is drawn, as the interface switches it. */
  readonly gridShown: ValueStore<boolean>;
  /** Where the pointer is in the world, kept current for whoever shares it; nowhere off the canvas. */
  readonly pointer: ValueStore<Point | undefined>;
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
  canvasSize: ValueStore<CanvasSize>,
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
    room: { floor: { ...surface, alpha: 0.85 }, selection: { ...accent, alpha: 0.16 } },
    wall: { ...ink, alpha: 0.9 },
    work: { edge: line, card: surface, ink, muted, loading: accent },
    outline: accent,
    badge: { back: accent, ink: surface },
  };
  const layerOf = (plan: Plan): GalleryLayer =>
    new GalleryLayer(
      stage.world,
      plan,
      SPACING.wallCm,
      images,
      useOwnStore.getState().pictures,
      colors,
      requestFrame
    );
  let gallery = layerOf(currentPlan());
  const tour = new Tour({
    camera,
    route: currentRoute,
    canvasSize: () => stage.canvasSize,
    extentOf: (stop) => gallery.extentOf(stop.work),
    fitPadding: FIT_PADDING,
    isMotionReduced,
  });
  // The view opens on the first room, the Foyer, with the way on in sight.
  const first = currentPlan().rooms[0];
  camera.fit(
    stage.canvasSize,
    first === undefined ? currentPlan().bounds : first.rect,
    FIT_PADDING
  );
  gallery.follow(camera.current);
  // Made after the fit, so its first cell is drawn for the zoom the view opens at.
  const grid = new DotGrid(
    stage.app.renderer,
    stage.app.stage,
    { crossing: muted, line: { ...muted, alpha: 0.6 } },
    requestFrame,
    camera.current,
    stage.canvasSize
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
    gallery.select(useStore.getState().selected);
    requestFrame();
  });
  // The rooms picked for removal, shown as they change.
  let selected = useStore.getState().selected;
  const stopSelection = useStore.subscribe((state) => {
    if (state.selected !== selected) {
      selected = state.selected;
      gallery.select(selected);
    }
  });
  // A double tap fills the view with what is under it: a work with its
  // label, joining the tour there, else its room, else the whole plan.
  // Reduced motion jumps instead of gliding.
  const rectOfTarget = (target: Target): WorldRect => {
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
    moveTo(
      camera,
      camera.fitted(stage.canvasSize, rectOfTarget(target), FIT_PADDING),
      stage.canvasSize
    );
  });
  const tools = mountEditTools({
    host,
    canvas: stage.app.canvas,
    camera,
    gallery: () => gallery,
  });
  // Under a pointer at rest, the same target is shown, so what lights up is
  // what a double tap would fill the view with. A held pointer is a tool's
  // or a pan's, and the world under it is moving, so it shows nothing.
  const onHover = (event: PointerEvent): void => {
    const world = camera.toWorld(pointOn(host, event));
    hooks.pointer.set(world);
    if (event.buttons !== 0) {
      return;
    }
    const target = targetAt(currentPlan(), world);
    gallery.highlight(target);
    gallery.hint(tools.hintAt(world));
    host.dataset["over"] = tools.overAt(target, world);
  };
  const onLeave = (): void => {
    hooks.pointer.set(undefined);
    gallery.highlight(undefined);
    gallery.hint(undefined);
    delete host.dataset["over"];
  };
  host.addEventListener("pointermove", onHover);
  host.addEventListener("pointerleave", onLeave);
  const stopTap = input.onTap((at, modifiers) => hooks.onTap(camera.toWorld(at), modifiers));
  const stopGridSwitch = hooks.gridShown.subscribe((isShown) => grid.show(isShown));
  grid.show(hooks.gridShown.current);
  const stopResize = stage.onResize(() => {
    canvasSize.set(stage.canvasSize);
    grid.resize(stage.canvasSize);
  });
  canvasSize.set(stage.canvasSize);
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
      hooks.pointer.set(undefined);
      tools.dispose();
      stopSelection();
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
