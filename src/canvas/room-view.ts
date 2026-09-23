/**
 * ─ Room view ─
 *
 * One room on the plan: its floor. The name at its corner is the
 * DOM's, placed by the same camera, so it stays one size on screen
 * and is edited in place. Under the pointer the floor brightens, which
 * is how a room says a double tap would fill the view with it; picked
 * for removal, it is tinted and edged in the accent. The floor can be
 * drawn over another rect, for the preview of a resize.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { Container, Graphics } from "pixi.js";
import type { WorldRect } from "../geometry.js";
import type { HungRoom } from "../gallery/hang.js";
import type { PackedColor } from "./css-color.js";

export interface RoomColors {
  readonly floor: PackedColor;
  /** Over the floor of a picked room: its alpha is the tint's, its edge drawn full. */
  readonly selection: PackedColor;
}

/** One hung room: its floor, lit or at rest, picked or not. */
export class RoomView {
  readonly container = new Container();
  readonly id: string;
  private readonly floor = new Graphics();
  private readonly tint = new Graphics();
  private readonly colors: RoomColors;

  constructor(hung: HungRoom, colors: RoomColors) {
    this.id = hung.room.id;
    this.colors = colors;
    // The floor's colour at full strength, and its rest alpha on the object, so lighting it is one number.
    this.floor.alpha = colors.floor.alpha;
    this.tint.visible = false;
    this.container.addChild(this.floor, this.tint);
    this.reshape(hung.rect);
  }

  /** Draw the floor over `rect`: the room as hung, or as a drag would have it. */
  reshape(rect: WorldRect): void {
    const { floor, selection } = this.colors;
    const width = rect.right - rect.left;
    const height = rect.bottom - rect.top;
    this.container.position.set(rect.left, rect.top);
    this.floor.clear().rect(0, 0, width, height).fill({ color: floor.rgb, alpha: 1 });
    this.tint
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: selection.rgb, alpha: selection.alpha })
      .stroke({ color: selection.rgb, alpha: 1, width: 1, pixelLine: true });
  }

  /** Brighten the floor, or let it rest. */
  light(isLit: boolean): void {
    this.floor.alpha = isLit ? 1 : this.colors.floor.alpha;
  }

  /** Show the room picked, or not. */
  select(isSelected: boolean): void {
    this.tint.visible = isSelected;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
