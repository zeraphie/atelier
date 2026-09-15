/**
 * ─ Gallery layer ─
 *
 * The plan, drawn: every room's floor, the walls over them, and every
 * work above the walls, all in world space under the camera. Each
 * camera change is passed on as the zoom, which is the one thing the
 * views react to: a room holds its name at one screen size, and a
 * work picks its tier and picture. The layer also shows what a double
 * tap would fill the view with, under the pointer: a room lit, a work
 * outlined with its label, or the whole plan lifted by a shadow.
 */

import { BlurFilter, Graphics, type Container } from "pixi.js";
import type { CameraState, WorldRect } from "../camera/index.js";
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
  /** The shadow under the plan when the pointer is off it. */
  readonly shadow: PackedColor;
}

// Screen pixels: the outline's clearance from a work and its label, and how far the shadow reaches.
const OUTLINE_PAD_PX = 6;
const SHADOW_BLUR_PX = 16;

/** Rooms, walls and works, drawn into `world` and following the camera. */
export class GalleryLayer {
  private readonly rooms: RoomView[];
  private readonly walls: Graphics;
  private readonly works: WorkView[];
  private readonly byId = new Map<string, WorkView>();
  private readonly shadow: Graphics;
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
    this.shadow = shadowUnder(plan.bounds, wallCm, colors.shadow);
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
    world.addChild(this.shadow);
    world.addChild(...this.rooms.map((room) => room.container));
    world.addChild(this.walls);
    world.addChild(...this.works.map((work) => work.container));
    world.addChild(this.outline);
  }

  /** A work and its label together, for a view that fits both; the work's frame alone if unknown. */
  extentOf(hung: { readonly work: { readonly id: string }; readonly rect: WorldRect }): WorldRect {
    return this.byId.get(hung.work.id)?.extent() ?? hung.rect;
  }

  follow(state: CameraState): void {
    this.zoom = state.zoom;
    for (const room of this.rooms) {
      room.follow(state.zoom);
    }
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
    this.shadow.visible = target?.kind === "plan";
    this.drawOutline();
    this.requestFrame();
  }

  destroy(): void {
    this.shadow.destroy();
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

// A soft dark rect under the plan, reaching a wall's width past its bounds
// to sit under the outer walls' caps. Blurred in screen pixels, since a
// filter works on the screen, so it is as soft at every zoom.
function shadowUnder(bounds: WorldRect, wallCm: number, color: PackedColor): Graphics {
  const shadow = new Graphics({ label: "shadow" })
    .rect(
      bounds.left - wallCm,
      bounds.top - wallCm,
      bounds.right - bounds.left + 2 * wallCm,
      bounds.bottom - bounds.top + 2 * wallCm
    )
    .fill({ color: color.rgb, alpha: color.alpha });
  shadow.filters = [new BlurFilter({ strength: SHADOW_BLUR_PX })];
  shadow.visible = false;
  return shadow;
}
