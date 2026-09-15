/**
 * ─ Gallery layer ─
 *
 * The hang, drawn: every room, then every work above the rooms, all in
 * world space under the camera. Each camera change is passed on as the
 * zoom, which is the one thing the views react to: a room holds its
 * name at one screen size, and a work picks its tier and picture.
 */

import type { Container } from "pixi.js";
import type { CameraState } from "../camera/index.js";
import type { Hang } from "../gallery/hang.js";
import type { ImageEntry } from "../gallery/tiers.js";
import { RoomView, type RoomColors } from "./room-view.js";
import { WorkView, type WorkColors } from "./work-view.js";

export interface GalleryColors {
  readonly room: RoomColors;
  readonly work: WorkColors;
}

/** Rooms and works, drawn into `world` and following the camera. */
export class GalleryLayer {
  private readonly rooms: RoomView[];
  private readonly works: WorkView[];

  constructor(
    world: Container,
    hang: Hang,
    images: Readonly<Record<string, ImageEntry>>,
    colors: GalleryColors,
    requestFrame: () => void
  ) {
    this.rooms = hang.rooms.map((hung) => new RoomView(hung, colors.room));
    this.works = hang.rooms.flatMap((hung) =>
      hung.works.map((work) => {
        const entry = images[work.work.id];
        if (entry === undefined) {
          throw new Error(`images.json has no entry for the work "${work.work.id}"`);
        }
        return new WorkView(work, entry, colors.work, requestFrame);
      })
    );
    world.addChild(...this.rooms.map((room) => room.container));
    world.addChild(...this.works.map((work) => work.container));
  }

  follow(state: CameraState): void {
    for (const room of this.rooms) {
      room.follow(state.zoom);
    }
    for (const work of this.works) {
      work.follow(state.zoom);
    }
  }

  destroy(): void {
    for (const room of this.rooms) {
      room.destroy();
    }
    for (const work of this.works) {
      work.destroy();
    }
  }
}
