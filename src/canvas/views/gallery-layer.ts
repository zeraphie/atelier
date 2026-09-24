/**
 * ─ Gallery layer ─
 *
 * The plan, drawn: every room's floor, the walls over them, and every
 * work above the walls, all in world space under the camera. Each
 * camera change is passed on as the zoom, which is the one thing the
 * views react to: a work picks its tier and picture, and the marks
 * keep their size on screen. The layer lights what a double tap would
 * fill the view with, and while a wall is dragged or a room drawn it
 * shows the preview: floors and walls from the plan the drag would
 * make, with the marks view's ghost and badge over them. The works
 * stay where they are until the edit lands.
 * Decision: DECISIONS.md, levels of detail by zoom.
 */

import { Container, Graphics } from "pixi.js";
import type { CameraState } from "../../camera/index.js";
import type { Point, Segment, WorldRect } from "../../geometry.js";
import type { Plan } from "../../gallery/layout/hang.js";
import type { Target } from "../../gallery/layout/targets.js";
import type { ImageEntry } from "../../gallery/tiers.js";
import type { PictureRecord } from "../../state/slices/collection.js";
import type { PackedColor } from "../theme/css-color.js";
import { MarksView } from "./marks-view.js";
import { entryFor, sourceFor } from "./picture-source.js";
import { RoomView, type RoomColors } from "./room-view.js";
import { drawPosts, drawWalls } from "./walls-view.js";
import { WorkView, type WorkColors } from "./work-view.js";

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
  private readonly marks: MarksView;
  private readonly colors: GalleryColors;
  private readonly requestFrame: () => void;
  private target: Target | undefined;
  private shown: LayerPreview | undefined;
  private hinted: EdgeHint | undefined;

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
    this.marks = new MarksView({ outline: colors.outline, badge: colors.badge }, wallCm);
    world.addChild(...this.rooms.map((room) => room.container));
    world.addChild(this.drawnFloor, this.walls);
    world.addChild(...this.works.map((work) => work.container));
    world.addChild(this.marks.container);
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
    this.marks.ghostOf(shown?.ghost);
    this.marks.badgeOf(this.shown?.label ?? this.hinted?.label);
    this.requestFrame();
  }

  /** Show the edge the Door tool would take, with what a click would do, or nothing. */
  hint(shown: EdgeHint | undefined): void {
    this.hinted = shown;
    this.marks.edgeOf(shown?.segment);
    this.marks.badgeOf(this.shown?.label ?? this.hinted?.label);
    this.requestFrame();
  }

  /** A work and its label together, for a view that fits both; the work's frame alone if unknown. */
  extentOf(hung: { readonly work: { readonly id: string }; readonly rect: WorldRect }): WorldRect {
    return this.byId.get(hung.work.id)?.extent() ?? hung.rect;
  }

  follow(state: CameraState): void {
    for (const work of this.works) {
      work.follow(state.zoom);
    }
    // The outlined work's extent may have grown a label at the new tier.
    this.marks.outlineOf(this.outlined());
    this.marks.follow(state.zoom);
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
    this.marks.outlineOf(this.outlined());
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
    this.marks.destroy();
  }

  // The extent of the work under the pointer, the outline's rect; none over anything else.
  private outlined(): WorldRect | undefined {
    return this.target?.kind === "work" ? this.extentOf(this.target.work) : undefined;
  }
}
