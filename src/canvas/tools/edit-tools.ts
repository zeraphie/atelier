/**
 * ─ Edit tools ─
 *
 * The tools wired to the canvas: each a pointer session on the canvas
 * element, active while its tool is held in edit mode, previewing on
 * the gallery layer and telling its edit to the store; and what the
 * pointer is over, for the cursor and for the layer's hint. Made by
 * the mount and taken apart with it. The session lives on the canvas
 * element, under the host, so a press a tool takes never starts a pan.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import { firstOf, isMotionReduced, PointerSession, type Camera } from "../../camera/index.js";
import type { Point } from "../../geometry.js";
import { wallNear } from "../../gallery/edit/resize.js";
import { edgeSegment } from "../../gallery/layout/edges.js";
import { rectOf, SPACING } from "../../gallery/layout/hang.js";
import type { Target } from "../../gallery/layout/targets.js";
import { mayHandle, type Work } from "../../gallery/works.js";
import { useOwnStore } from "../../state/own-store.js";
import type { Tool } from "../../state/slices/interface.js";
import { useStore } from "../../state/store.js";
import { currentPlan, planWith } from "../../state/utils/plan.js";
import type { EdgeHint, GalleryLayer } from "../views/gallery-layer.js";
import { DoorTool } from "./door-tool.js";
import { DrawTool } from "./draw-tool.js";
import { MoveTool } from "./move-tool.js";
import { ResizeTool } from "./resize-tool.js";
import { ScaleTool } from "./scale-tool.js";

// How near a wall a press in edit mode must be: screen pixels, but never more than a metre of floor.
const WALL_REACH_PX = 20;
const WALL_REACH_MOST_CM = 100;
// A room being drawn, in the preview plan; and the name a drawn room has until it is given one.
const DRAWING_ID = "drawing";
const DRAWN_NAME = "Room";

export interface EditToolsDeps {
  /** The host whose cursor the tools set. */
  readonly host: HTMLElement;
  /** The canvas element the sessions press on. */
  readonly canvas: HTMLCanvasElement;
  readonly camera: Camera;
  /** The gallery layer as it stands: it is made anew on every plan. */
  readonly gallery: () => GalleryLayer;
}

export interface EditTools {
  /** What the Door tool would do at a world point, for the layer to show; nothing unless the Door tool is held. */
  hintAt(world: Point): EdgeHint | undefined;
  /** What a press at a world point would take, for the cursor: a corner, an edge, a wall, another's picture, or the target's own kind. */
  overAt(target: Target, world: Point): string;
  dispose(): void;
}

/** Wire the edit tools to the canvas: each active while held, previewing on the layer and telling the store. */
export function mountEditTools({ host, canvas, camera, gallery }: EditToolsDeps): EditTools {
  const holds = (tool: Tool) => (): boolean => {
    const state = useStore.getState();
    return state.mode === "edit" && state.tool === tool;
  };
  const isMoving = holds("move");
  const isDrawing = holds("room");
  const isDooring = holds("door");
  const isPicturing = holds("picture");
  const toWorld = (at: Point): Point => camera.toWorld(at);
  const reachCm = (): number => Math.min(WALL_REACH_PX / camera.current.zoom, WALL_REACH_MOST_CM);
  // Whether this person may move or size a work: any gallery work, and a picture they hung.
  const mayHandleWork = (work: Work): boolean => mayHandle(work, useOwnStore.getState().userId);
  // The Picture tool: a press on a corner of a picture of your own scales it;
  // a click on a room's floor asks for a picture, as a tap the host takes.
  const scaleTool = new ScaleTool({
    plan: currentPlan,
    mayHandle: mayHandleWork,
    reachCm,
    stretch: (id, rect) => gallery().stretch(id, rect),
    resize: (id, centre, widthCm) => {
      const hanging = useStore.getState().hangings[id]?.value;
      if (hanging !== undefined && hanging !== null) {
        useStore.getState().hang({ ...hanging, at: centre, widthCm });
      }
    },
    host,
  });
  // The Door tool: a click on a metre edge of a wall puts a doorway there,
  // or takes it away when it is there already.
  const doorTool = new DoorTool({
    plan: currentPlan,
    unitCm: SPACING.unitCm,
    reachCm,
    put: (pair, edge) => useStore.getState().moveDoor(pair, edge),
    take: (pair) => useStore.getState().removeDoor(pair),
  });
  const hintAt = (world: Point): EdgeHint | undefined => {
    const action = isDooring() ? doorTool.actionAt(world) : undefined;
    if (action === undefined) {
      return undefined;
    }
    return {
      segment: edgeSegment(action.edge, SPACING.unitCm),
      label: { text: action.isThere ? "Take the doorway away" : "Doorway here", at: world },
    };
  };
  // The cursor is told what a press would take: a work before a wall, as the tools go.
  const overAt = (target: Target, world: Point): string => {
    if (isDooring()) {
      return doorTool.actionAt(world) === undefined ? target.kind : "edge";
    }
    if (isPicturing()) {
      const hit = scaleTool.cornerAt(world);
      if (hit !== undefined) {
        return hit.corner === "nw" || hit.corner === "se" ? "corner-nwse" : "corner-nesw";
      }
    }
    if (target.kind === "work" && !mayHandleWork(target.work.work)) {
      // Another person's picture: nothing to take hold of, so no grab.
      return "other";
    }
    if (target.kind !== "work" && isMoving()) {
      const hit = wallNear(currentPlan(), world, reachCm());
      if (hit !== undefined) {
        return hit.side === "left" || hit.side === "right" ? "wall-x" : "wall-y";
      }
    }
    return target.kind;
  };
  // The Move tool: a press on a picture drags it and a press near a wall
  // drags the wall; any other press falls through to the camera. The wall's
  // preview is the plan the drag would make, hung afresh, so the doorways
  // move with the wall.
  const resizing = new ResizeTool({
    plan: currentPlan,
    unitCm: SPACING.unitCm,
    reachCm,
    preview: (shown) =>
      gallery().preview(
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
    canvas,
    toWorld,
    firstOf(
      new MoveTool({
        plan: currentPlan,
        mayHandle: mayHandleWork,
        nudge: (id, centre) => gallery().nudge(id, centre),
        move: (id, centre) => useStore.getState().moveWork(id, centre),
        host,
      }),
      resizing
    )
  );
  // The Room tool: a drag on empty ground draws a room, previewed as the plan
  // with it in, then drawn with a name to be given in place; a click on the
  // ground lets the picked rooms go, and a click on a room is a tap the host takes.
  const drawing = new PointerSession(
    canvas,
    toWorld,
    new DrawTool({
      plan: currentPlan,
      unitCm: SPACING.unitCm,
      preview: (shown) =>
        gallery().preview(
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
  const dooring = new PointerSession(canvas, toWorld, doorTool);
  const picturing = new PointerSession(canvas, toWorld, scaleTool);
  const sessions = [
    [moving, isMoving],
    [drawing, isDrawing],
    [dooring, isDooring],
    [picturing, isPicturing],
  ] as const;
  // Each session is active while its tool is held; a hint outlives the Door tool otherwise.
  const activate = (): void => {
    for (const [session, isHeld] of sessions) {
      session.setActive(isHeld());
    }
    if (!isDooring()) {
      gallery().hint(undefined);
    }
  };
  const stopTools = useStore.subscribe(activate);
  activate();
  return {
    hintAt,
    overAt,
    dispose() {
      stopTools();
      for (const [session] of sessions) {
        session.dispose();
      }
      resizing.dispose();
    },
  };
}
