/**
 * ─ Gallery layer ─
 *
 * The plan, drawn: every room's floor, the walls over them, and every
 * work above the walls, all in world space under the camera. Each
 * camera change is passed on as the zoom, which is the one thing the
 * views react to: a room holds its name at one screen size, and a
 * work picks its tier and picture. The layer also shows what a double
 * tap would fill the view with, under the pointer: a room lit, or a work
 * outlined with its label.
 */

import { Graphics, type Container } from "pixi.js";
import type { CameraState, Point, WorldRect } from "../camera/index.js";
import type { Plan } from "../gallery/hang.js";
import type { Target } from "../gallery/targets.js";
import type { ImageEntry } from "../gallery/tiers.js";
import type { PackedColor } from "./css-color.js";
import { RoomView, type RoomColors } from "./room-view.js";
import { drawWalls } from "./walls-view.js";
import { WorkView, type WorkColors } from "./work-view.js";

export interface GalleryColors {
  readonly room: RoomColors;
  readonly wall: PackedColor;
  readonly work: WorkColors;
  /** The outline around a work under the pointer. */
  readonly outline: PackedColor;
}

// Screen pixels the outline keeps clear of a work and its label.
const OUTLINE_PAD_PX = 6;

/** Rooms, walls and works, drawn into `world` and following the camera. */
export class GalleryLayer {
  private readonly rooms: RoomView[];
  private readonly walls: Graphics;
  private readonly works: WorkView[];
  private readonly byId = new Map<string, WorkView>();
  private readonly outline = new Graphics({ label: "outline" });
  private readonly colors: GalleryColors;
  private readonly requestFrame: () => void;
  private target: Target | undefined;
  private zoom = 1;

  constructor(
    world: Container,
    plan: Plan,
    wallCm: number,
    images: Readonly<Record<string, ImageEntry>>,
    colors: GalleryColors,
    requestFrame: () => void
  ) {
    this.colors = colors;
    this.requestFrame = requestFrame;
    this.rooms = plan.rooms.map((hung) => new RoomView(hung, colors.room));
    this.walls = drawWalls(plan.walls, wallCm, colors.wall);
    this.works = plan.rooms.flatMap((hung) =>
      hung.works.map((work) => {
        const entry = images[work.work.id];
        if (entry === undefined) {
          throw new Error(`images.json has no entry for the work "${work.work.id}"`);
        }
        return new WorkView(work, entry, colors.work, requestFrame);
      })
    );
    for (const [i, hung] of plan.rooms.flatMap((room) => room.works).entries()) {
      this.byId.set(hung.work.id, this.works[i]!);
    }
    world.addChild(...this.rooms.map((room) => room.container));
    world.addChild(this.walls);
    world.addChild(...this.works.map((work) => work.container));
    world.addChild(this.outline);
  }

  /** Show a work at a centre for the length of a drag; the plan, and so the layer, still say where it is. */
  nudge(workId: string, centre: Point): void {
    this.byId.get(workId)?.moveTo(centre);
  }

  /** A work and its label together, for a view that fits both; the work's frame alone if unknown. */
  extentOf(hung: { readonly work: { readonly id: string }; readonly rect: WorldRect }): WorldRect {
    return this.byId.get(hung.work.id)?.extent() ?? hung.rect;
  }

  follow(state: CameraState): void {
    this.zoom = state.zoom;
    for (const work of this.works) {
      work.follow(state.zoom);
    }
    // The outline keeps its clearance in screen pixels, so it is drawn again at the new zoom.
    this.drawOutline();
  }

  /** Show what a double tap would fill the view with, or nothing when the pointer is elsewhere. */
  highlight(target: Target | undefined): void {
    this.target = target;
    for (const room of this.rooms) {
      room.light(target?.kind === "room" && target.room.room.id === room.id);
    }
    this.drawOutline();
    this.requestFrame();
  }

  destroy(): void {
    for (const room of this.rooms) {
      room.destroy();
    }
    this.walls.destroy();
    for (const work of this.works) {
      work.destroy();
    }
    this.outline.destroy();
  }

  // A hairline around the work and its label, the fit's own extent, a few screen pixels clear of both.
  private drawOutline(): void {
    this.outline.clear();
    if (this.target?.kind !== "work") {
      this.outline.visible = false;
      return;
    }
    const { outline } = this.colors;
    const rect = this.extentOf(this.target.work);
    const pad = OUTLINE_PAD_PX / this.zoom;
    this.outline
      .rect(
        rect.left - pad,
        rect.top - pad,
        rect.right - rect.left + 2 * pad,
        rect.bottom - rect.top + 2 * pad
      )
      .stroke({ color: outline.rgb, alpha: outline.alpha, width: 1, pixelLine: true });
    this.outline.visible = true;
  }
}
