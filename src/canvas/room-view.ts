/**
 * ─ Room view ─
 *
 * One room on the plan: its floor. The name at its corner is the
 * DOM's, placed by the same camera, so it stays one size on screen
 * and is edited in place. Under the pointer the floor brightens, which
 * is how a room says a double tap would fill the view with it. The
 * floor can be drawn over another rect, for the preview of a resize.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { Container, Graphics } from "pixi.js";
import type { WorldRect } from "../camera/index.js";
import type { HungRoom } from "../gallery/hang.js";
import type { PackedColor } from "./css-color.js";

export interface RoomColors {
  readonly floor: PackedColor;
}

/** One hung room: its floor, lit or at rest. */
export class RoomView {
  readonly container = new Container();
  readonly id: string;
  private readonly floor = new Graphics();
  private readonly floorColor: number;
  private readonly floorAlpha: number;

  constructor(hung: HungRoom, colors: RoomColors) {
    this.id = hung.room.id;
    // The floor's colour at full strength, and its rest alpha on the object, so lighting it is one number.
    this.floorColor = colors.floor.rgb;
    this.floorAlpha = colors.floor.alpha;
    this.floor.alpha = this.floorAlpha;
    this.container.addChild(this.floor);
    this.reshape(hung.rect);
  }

  /** Draw the floor over `rect`: the room as hung, or as a drag would have it. */
  reshape(rect: WorldRect): void {
    this.container.position.set(rect.left, rect.top);
    this.floor
      .clear()
      .rect(0, 0, rect.right - rect.left, rect.bottom - rect.top)
      .fill({ color: this.floorColor, alpha: 1 });
  }

  /** Brighten the floor, or let it rest. */
  light(isLit: boolean): void {
    this.floor.alpha = isLit ? 1 : this.floorAlpha;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
