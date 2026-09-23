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
  firstOf,
  isMotionReduced,
  moveTo,
  PointerSession,
  type Camera,
  type Point,
  type TapModifiers,
  type ViewSize,
  type WorldRect,
} from "../camera/index.js";
import { edgeSegment } from "../gallery/edges.js";
import { rectOf, SPACING, type Plan } from "../gallery/hang.js";
import images from "../gallery/images.json";
import { wallNear } from "../gallery/resize.js";
import { cornerNear } from "../gallery/scale.js";
import { targetAt, type Target } from "../gallery/targets.js";
import { currentPlan, currentRoute, onPlanChange, planWith } from "../state/utils/plan.js";
import { useOwnStore } from "../state/own-store.js";
import { useStore } from "../state/store.js";
import { DoorTool } from "./door-tool.js";
import { DotGrid } from "./dot-grid.js";
import { DrawTool } from "./draw-tool.js";
import { whenFacesReady } from "./faces.js";
import { GalleryLayer, type EdgeHint, type GalleryColors } from "./gallery-layer.js";
import { MoveTool } from "./move-tool.js";
import { ResizeTool } from "./resize-tool.js";
import { ScaleTool } from "./scale-tool.js";
import { Stage } from "./stage.js";
import { tokenColor } from "./theme.js";
import { Tour, type TourHandle } from "./tour.js";
import type { ValueStore } from "./value-store.js";

export interface MountHooks {
  /** A tap on empty canvas, as a world point, with the keys held. */
  readonly onTap: (world: Point, modifiers: TapModifiers) => void;
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

// How near a wall a press in edit mode must be: screen pixels, but never more than a metre of floor.
const WALL_REACH_PX = 20;
const WALL_REACH_MOST_CM = 100;
// A room being drawn, in the preview plan; and the name a drawn room has until it is given one.
const DRAWING_ID = "drawing";
const DRAWN_NAME = "Room";

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
    moveTo(camera, camera.fitted(stage.view, rectOfTarget(target), FIT_PADDING), stage.view);
  });
  // In edit mode with Move held, a press on a picture drags it and a press
  // near a wall drags the wall; any other press falls through to the camera.
  const isMoving = (): boolean => {
    const { mode, tool } = useStore.getState();
    return mode === "edit" && tool === "move";
  };
  const reachCm = (): number => Math.min(WALL_REACH_PX / camera.current.zoom, WALL_REACH_MOST_CM);
  const isPicturing = (): boolean => {
    const { mode, tool } = useStore.getState();
    return mode === "edit" && tool === "picture";
  };
  // The Door tool: a click on a metre edge of a wall two rooms share puts
  // their doorway there, or takes it away when it is there already.
  const isDooring = (): boolean => {
    const { mode, tool } = useStore.getState();
    return mode === "edit" && tool === "door";
  };
  const doorTool = new DoorTool({
    plan: currentPlan,
    unitCm: SPACING.unitCm,
    reachCm,
    put: (pair, edge) => useStore.getState().moveDoor(pair, edge),
    take: (pair) => useStore.getState().removeDoor(pair),
  });
  // What the Door tool would do under the pointer, for the layer to show.
  const hintAt = (world: Point): EdgeHint | undefined => {
    const action = doorTool.actionAt(world);
    if (action === undefined) {
      return undefined;
    }
    return {
      segment: edgeSegment(action.edge, SPACING.unitCm),
      label: { text: action.isThere ? "Take the doorway away" : "Doorway here", at: world },
    };
  };
  // Under a pointer at rest, the same target is shown, so what lights up is
  // what a double tap would fill the view with. A held pointer is panning,
  // and the world under it is moving, so it shows nothing. The cursor is
  // told what a press would take: a work before a wall, as the tools go.
  const overAt = (target: Target, world: Point): string => {
    if (isDooring()) {
      return doorTool.actionAt(world) === undefined ? target.kind : "edge";
    }
    if (isPicturing()) {
      const hit = cornerNear(currentPlan(), world, reachCm());
      if (hit !== undefined) {
        return hit.corner === "nw" || hit.corner === "se" ? "corner-nwse" : "corner-nesw";
      }
    }
    if (target.kind !== "work" && isMoving()) {
      const hit = wallNear(currentPlan(), world, reachCm());
      if (hit !== undefined) {
        return hit.side === "left" || hit.side === "right" ? "wall-x" : "wall-y";
      }
    }
    return target.kind;
  };
  const onHover = (event: PointerEvent): void => {
    if (event.buttons !== 0) {
      return;
    }
    const rect = host.getBoundingClientRect();
    const world = camera.toWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    const target = targetAt(currentPlan(), world);
    gallery.highlight(target);
    gallery.hint(isDooring() ? hintAt(world) : undefined);
    host.dataset["over"] = overAt(target, world);
  };
  const onLeave = (): void => {
    gallery.highlight(undefined);
    gallery.hint(undefined);
    delete host.dataset["over"];
  };
  // The session lives on the canvas element, under the host, so a press a
  // tool takes never starts a pan. The wall's preview is the plan the drag
  // would make, hung afresh, so the doorways move with the wall.
  const resizing = new ResizeTool({
    plan: currentPlan,
    unitCm: SPACING.unitCm,
    reachCm,
    preview: (shown) =>
      gallery.preview(
        shown === undefined
          ? undefined
          : {
              plan: planWith(shown.roomId, shown.dragged),
              ghost: rectOf(shown.ghost, SPACING.unitCm),
              label: shown.label,
            }
      ),
    resize: (id, cells) => useStore.getState().resizeRoom(id, cells),
    host,
    isMotionReduced,
    // Called through the tool, so the browser must not be handed the tool as its receiver.
    frame: (callback) => requestAnimationFrame(callback),
  });
  const moving = new PointerSession(
    stage.app.canvas,
    (at) => camera.toWorld(at),
    firstOf(
      new MoveTool({
        plan: currentPlan,
        nudge: (id, centre) => gallery.nudge(id, centre),
        move: (id, centre) => useStore.getState().moveWork(id, centre),
        host,
      }),
      resizing
    )
  );
  // The Room tool: a drag on empty ground draws a room, previewed as the plan
  // with it in, then drawn with a name to be given in place; a click on the
  // ground lets the picked rooms go, and a click on a room is a tap, below.
  const isDrawing = (): boolean => {
    const { mode, tool } = useStore.getState();
    return mode === "edit" && tool === "room";
  };
  const drawing = new PointerSession(
    stage.app.canvas,
    (at) => camera.toWorld(at),
    new DrawTool({
      plan: currentPlan,
      unitCm: SPACING.unitCm,
      preview: (shown) =>
        gallery.preview(
          shown === undefined
            ? undefined
            : {
                plan: planWith(DRAWING_ID, shown.cells),
                ghost: rectOf(shown.cells, SPACING.unitCm),
                label: shown.label,
              }
        ),
      draw: (cells) => {
        const id = crypto.randomUUID();
        useStore.getState().drawRoom(id, DRAWN_NAME, cells);
        useStore.getState().askName(id);
      },
      tapped: () => useStore.getState().clearSelection(),
      host,
    })
  );
  const dooring = new PointerSession(stage.app.canvas, (at) => camera.toWorld(at), doorTool);
  // The Picture tool: a press on a corner of a picture of your own scales it;
  // a click on a room's floor asks for a picture, as a tap, below.
  const picturing = new PointerSession(
    stage.app.canvas,
    (at) => camera.toWorld(at),
    new ScaleTool({
      plan: currentPlan,
      reachCm,
      stretch: (id, rect) => gallery.stretch(id, rect),
      resize: (id, centre, widthCm) => {
        const hanging = useStore.getState().hangings[id]?.value;
        if (hanging !== undefined && hanging !== null) {
          useStore.getState().hang({ ...hanging, at: centre, widthCm });
        }
      },
      host,
    })
  );
  const stopTools = useStore.subscribe(() => {
    moving.setActive(isMoving());
    drawing.setActive(isDrawing());
    dooring.setActive(isDooring());
    picturing.setActive(isPicturing());
    if (!isDooring()) {
      gallery.hint(undefined);
    }
  });
  moving.setActive(isMoving());
  drawing.setActive(isDrawing());
  dooring.setActive(isDooring());
  picturing.setActive(isPicturing());
  host.addEventListener("pointermove", onHover);
  host.addEventListener("pointerleave", onLeave);
  const stopTap = input.onTap((at, modifiers) => hooks.onTap(camera.toWorld(at), modifiers));
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
      drawing.dispose();
      dooring.dispose();
      picturing.dispose();
      resizing.dispose();
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
