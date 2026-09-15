/**
 * ─ Room view ─
 *
 * One room on the plan: its floor, and its name at the top left, held
 * at one size on screen whatever the zoom, the way a section label
 * behaves in a design tool. From far off the rooms are the plan; up
 * close the name is a small header. Under the pointer the floor
 * brightens, which is how a room says a double tap would fill the
 * view with it.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { Container, Graphics, Text } from "pixi.js";
import type { HungRoom } from "../gallery/hang.js";
import type { PackedColor } from "./css-color.js";

export interface RoomColors {
  readonly floor: PackedColor;
  readonly name: PackedColor;
}

// Text is drawn at this size and scaled to the size wanted on screen.
const TEXT_PX = 24;
// The name's size on screen, and its inset from the room's corner in centimetres.
const NAME_PX = 13;
const NAME_INSET_CM = 16;

/** One hung room: its floor, and its name at a constant screen size. */
export class RoomView {
  readonly container = new Container();
  readonly id: string;
  private readonly floor: Graphics;
  private readonly floorAlpha: number;
  private readonly name: Text;

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
    this.name = new Text({
      text: hung.room.name,
      style: {
        fontFamily: "Cinzel Decorative",
        fontWeight: "700",
        fontSize: TEXT_PX,
        fill: colors.name.rgb,
      },
    });
    this.name.position.set(NAME_INSET_CM, NAME_INSET_CM);
    this.container.addChild(this.floor, this.name);
  }

  /** Follow the zoom: the name keeps its size on screen. */
  follow(zoom: number): void {
    this.name.scale.set(NAME_PX / (TEXT_PX * zoom));
  }

  /** Brighten the floor, or let it rest. */
  light(isLit: boolean): void {
    this.floor.alpha = isLit ? 1 : this.floorAlpha;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
