/**
 * ─ Room view ─
 *
 * One room on the plan: its floor. The name at its corner is the
 * DOM's, placed by the same camera, so it stays one size on screen
 * and is edited in place. Under the pointer the floor brightens, which
 * is how a room says a double tap would fill the view with it.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { Container, Graphics } from "pixi.js";
import type { HungRoom } from "../gallery/hang.js";
import type { PackedColor } from "./css-color.js";

export interface RoomColors {
  readonly floor: PackedColor;
}

/** One hung room: its floor, lit or at rest. */
export class RoomView {
  readonly container = new Container();
  readonly id: string;
  private readonly floor: Graphics;
  private readonly floorAlpha: number;

  constructor(hung: HungRoom, colors: RoomColors) {
    const { rect } = hung;
    this.id = hung.room.id;
    this.container.position.set(rect.left, rect.top);
    // The floor's colour at full strength, and its rest alpha on the object, so lighting it is one number.
    this.floorAlpha = colors.floor.alpha;
    this.floor = new Graphics()
      .rect(0, 0, rect.right - rect.left, rect.bottom - rect.top)
      .fill({ color: colors.floor.rgb, alpha: 1 });
    this.floor.alpha = this.floorAlpha;
    this.container.addChild(this.floor);
  }

  /** Brighten the floor, or let it rest. */
  light(isLit: boolean): void {
    this.floor.alpha = isLit ? 1 : this.floorAlpha;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
