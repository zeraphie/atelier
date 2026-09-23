/**
 * ─ Gallery layer ─
 *
 * The plan, drawn: every room's floor, the walls over them, and every
 * work above the walls, all in world space under the camera. Each
 * camera change is passed on as the zoom, which is the one thing the
 * views react to: a work picks its tier and picture, and what is held
 * at a screen size is scaled again. The layer also shows what a double
 * tap would fill the view with, under the pointer: a room lit, or a
 * work outlined with its label. While a wall is dragged it shows the
 * preview: floors and walls drawn from the plan the drag would make,
 * a dashed ghost on the metre line the wall will settle on, and a
 * badge by the pointer with the room's new measure. The works stay
 * where they are until the edit lands.
 */

import { Container, Graphics, Text } from "pixi.js";
import type { CameraState, Point, WorldRect } from "../camera/index.js";
import type { Plan, Segment } from "../gallery/hang.js";
import type { Target } from "../gallery/targets.js";
import type { ImageEntry } from "../gallery/tiers.js";
import type { Work } from "../gallery/works.js";
import { DERIVATIVE_PX } from "../pictures/prepare.js";
import type { PictureRecord } from "../state/slices/collection.js";
import type { PackedColor } from "./css-color.js";
import { RoomView, type RoomColors } from "./room-view.js";
import { loadOwnPicture, loadPicture } from "./textures.js";
import { drawPosts, drawWalls } from "./walls-view.js";
import { WorkView, type PictureSource, type WorkColors } from "./work-view.js";

export interface GalleryColors {
  readonly room: RoomColors;
  readonly wall: PackedColor;
  readonly work: WorkColors;
  /** The outline around a work under the pointer, and the ghost of a drag. */
  readonly outline: PackedColor;
  /** The badge by the pointer during a drag: its ground and its text. */
  readonly badge: { readonly back: PackedColor; readonly ink: PackedColor };
}

/** What a drag shows: the plan it would make, the rect it will settle on, and a measure by the pointer. */
export interface LayerPreview {
  readonly plan: Plan;
  readonly ghost: WorldRect;
  readonly label: { readonly text: string; readonly at: Point };
}

/** What the Door tool shows under the pointer: the edge a click would take, and what it would do. */
export interface EdgeHint {
  readonly segment: Segment;
  readonly label: { readonly text: string; readonly at: Point };
}

// Screen pixels the outline keeps clear of a work and its label.
const OUTLINE_PAD_PX = 6;
// The ghost's dashes and the gaps between them, in screen pixels.
const DASH_PX = 6;
const GAP_PX = 4;
// The badge: its text size on screen, its padding, its corner, and how far it sits from the pointer.
const BADGE_PX = 12;
const BADGE_PAD_X = 6;
const BADGE_PAD_Y = 2;
const BADGE_RADIUS = 4;
const BADGE_OFFSET_PX = 14;
// The hinted edge: how wide, as a multiple of the wall, and how strong.
const EDGE_WIDTH = 1.5;
const EDGE_ALPHA = 0.85;

/** Rooms, walls and works, drawn into `world` and following the camera. */
export class GalleryLayer {
  private readonly plan: Plan;
  private readonly wallCm: number;
  private readonly rooms: RoomView[];
  private readonly walls = new Graphics({ label: "walls" });
  // The floor of a room the plan does not have yet: the one being drawn.
  private readonly drawnFloor = new Graphics({ label: "drawn" });
  private readonly works: WorkView[];
  private readonly byId = new Map<string, WorkView>();
  private readonly outline = new Graphics({ label: "outline" });
  private readonly ghost = new Graphics({ label: "ghost" });
  private readonly edgeLight = new Graphics({ label: "edge" });
  private readonly badge = new Container({ label: "badge" });
  private readonly badgeBack = new Graphics();
  private readonly badgeText: Text;
  private readonly colors: GalleryColors;
  private readonly requestFrame: () => void;
  private target: Target | undefined;
  private shown: LayerPreview | undefined;
  private hinted: EdgeHint | undefined;
  private zoom = 1;

  constructor(
    world: Container,
    plan: Plan,
    wallCm: number,
    images: Readonly<Record<string, ImageEntry>>,
    pictures: Readonly<Record<string, PictureRecord>>,
    colors: GalleryColors,
    requestFrame: () => void
  ) {
    this.plan = plan;
    this.wallCm = wallCm;
    this.colors = colors;
    this.requestFrame = requestFrame;
    this.rooms = plan.rooms.map((hung) => new RoomView(hung, colors.room));
    drawWalls(this.walls, plan.walls, wallCm, colors.wall);
    drawPosts(this.walls, plan.doorways, wallCm, colors.wall);
    this.works = plan.rooms.flatMap((hung) =>
      hung.works.map((work) => {
        const entry = entryFor(work.work, images, pictures);
        if (entry === undefined) {
          throw new Error(`no picture is known for the work "${work.work.id}"`);
        }
        const record =
          work.work.pictureId === undefined ? undefined : pictures[work.work.pictureId];
        return new WorkView(
          work,
          entry,
          sourceFor(work.work),
          colors.work,
          requestFrame,
          record?.pending === true
        );
      })
    );
    for (const [i, hung] of plan.rooms.flatMap((room) => room.works).entries()) {
      this.byId.set(hung.work.id, this.works[i]!);
    }
    this.badgeText = new Text({
      text: "",
      style: { fontFamily: "Libertinus Sans", fontSize: BADGE_PX, fill: colors.badge.ink.rgb },
    });
    this.badgeText.position.set(BADGE_PAD_X, BADGE_PAD_Y);
    this.badge.addChild(this.badgeBack, this.badgeText);
    this.badge.visible = false;
    this.ghost.visible = false;
    world.addChild(...this.rooms.map((room) => room.container));
    world.addChild(this.drawnFloor, this.walls);
    world.addChild(...this.works.map((work) => work.container));
    world.addChild(this.outline, this.ghost, this.edgeLight, this.badge);
  }

  /** Show a work at a centre for the length of a drag; the plan, and so the layer, still say where it is. */
  nudge(workId: string, centre: Point): void {
    this.byId.get(workId)?.moveTo(centre);
  }

  /** Show a work stretched over a rect for the length of a drag; none puts it back as hung. */
  stretch(workId: string, rect: WorldRect | undefined): void {
    this.byId.get(workId)?.stretch(rect);
  }

  /** Show a drag, of a wall or of a room being drawn, or, with nothing, the plan as it is. */
  preview(shown: LayerPreview | undefined): void {
    this.shown = shown;
    const plan = shown?.plan ?? this.plan;
    for (const room of this.rooms) {
      const hung = plan.rooms.find((candidate) => candidate.room.id === room.id);
      if (hung !== undefined) {
        room.reshape(hung.rect);
      }
    }
    this.drawnFloor.clear();
    for (const hung of plan.rooms) {
      if (!this.rooms.some((room) => room.id === hung.room.id)) {
        const { rect } = hung;
        const { floor } = this.colors.room;
        this.drawnFloor
          .rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top)
          .fill({ color: floor.rgb, alpha: floor.alpha });
      }
    }
    drawWalls(this.walls, plan.walls, this.wallCm, this.colors.wall);
    drawPosts(this.walls, plan.doorways, this.wallCm, this.colors.wall);
    this.drawGhost();
    this.requestFrame();
  }

  /** Show the edge the Door tool would take, with what a click would do, or nothing. */
  hint(shown: EdgeHint | undefined): void {
    this.hinted = shown;
    this.drawGhost();
    this.requestFrame();
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
    // The outline and the ghost keep their measures in screen pixels, so both are drawn again at the new zoom.
    this.drawOutline();
    this.drawGhost();
  }

  /** Show which rooms are picked for removal, by id. */
  select(ids: readonly string[]): void {
    for (const room of this.rooms) {
      room.select(ids.includes(room.id));
    }
    this.requestFrame();
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
    this.drawnFloor.destroy();
    for (const work of this.works) {
      work.destroy();
    }
    this.outline.destroy();
    this.ghost.destroy();
    this.edgeLight.destroy();
    this.badge.destroy({ children: true });
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

  // The ghost as a dashed hairline, the hinted edge as a bar along the wall,
  // and the badge at one size on screen beside the pointer.
  private drawGhost(): void {
    const { outline, badge } = this.colors;
    this.ghost.clear();
    if (this.shown === undefined) {
      this.ghost.visible = false;
    } else {
      const { ghost } = this.shown;
      const corners: Point[] = [
        { x: ghost.left, y: ghost.top },
        { x: ghost.right, y: ghost.top },
        { x: ghost.right, y: ghost.bottom },
        { x: ghost.left, y: ghost.bottom },
      ];
      for (const [i, corner] of corners.entries()) {
        dashed(this.ghost, corner, corners[(i + 1) % 4]!, DASH_PX / this.zoom, GAP_PX / this.zoom);
      }
      this.ghost.stroke({ color: outline.rgb, alpha: outline.alpha, width: 1, pixelLine: true });
      this.ghost.visible = true;
    }
    this.edgeLight.clear();
    if (this.hinted === undefined) {
      this.edgeLight.visible = false;
    } else {
      const { a, b } = this.hinted.segment;
      this.edgeLight
        .moveTo(a.x, a.y)
        .lineTo(b.x, b.y)
        .stroke({ color: outline.rgb, alpha: EDGE_ALPHA, width: this.wallCm * EDGE_WIDTH });
      this.edgeLight.visible = true;
    }
    const label = this.shown?.label ?? this.hinted?.label;
    if (label === undefined) {
      this.badge.visible = false;
      return;
    }
    this.badgeText.text = label.text;
    this.badgeBack
      .clear()
      .roundRect(
        0,
        0,
        this.badgeText.width + 2 * BADGE_PAD_X,
        this.badgeText.height + 2 * BADGE_PAD_Y,
        BADGE_RADIUS
      )
      .fill({ color: badge.back.rgb, alpha: badge.back.alpha });
    this.badge.scale.set(1 / this.zoom);
    const offset = BADGE_OFFSET_PX / this.zoom;
    this.badge.position.set(label.at.x + offset, label.at.y + offset);
    this.badge.visible = true;
  }
}

// The line from `a` to `b` as dashes, drawn into `shapes` for one stroke after.
function dashed(shapes: Graphics, a: Point, b: Point, dash: number, gap: number): void {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length === 0) {
    return;
  }
  const ux = (b.x - a.x) / length;
  const uy = (b.y - a.y) / length;
  for (let at = 0; at < length; at += dash + gap) {
    const end = Math.min(at + dash, length);
    shapes.moveTo(a.x + ux * at, a.y + uy * at).lineTo(a.x + ux * end, a.y + uy * end);
  }
}

// What images.json says of a gallery work, or what the collection says of a picture of your own.
function entryFor(
  work: Work,
  images: Readonly<Record<string, ImageEntry>>,
  pictures: Readonly<Record<string, PictureRecord>>
): ImageEntry | undefined {
  if (work.pictureId === undefined) {
    return images[work.id];
  }
  const record = pictures[work.pictureId];
  if (record === undefined) {
    return undefined;
  }
  const { width, height } = record.size;
  return { color: record.color, width, height, sizes: [{ px: DERIVATIVE_PX, width, height }] };
}

// The site's image set for a gallery work; the database for a picture of your own.
function sourceFor(work: Work): PictureSource {
  const { pictureId } = work;
  return pictureId === undefined
    ? (px) => loadPicture(work.id, px)
    : (px) => loadOwnPicture(pictureId, px);
}
