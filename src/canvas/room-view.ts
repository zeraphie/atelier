/**
 * ─ Room view ─
 *
 * One room on the plan: its floor, and its name at the top left, held
 * at one size on screen whatever the zoom, the way a section label
 * behaves in a design tool. From far off the rooms are the plan; up
 * close the name is a small header.
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
  private readonly name: Text;

  constructor(hung: HungRoom, colors: RoomColors) {
    const { rect } = hung;
    this.container.position.set(rect.left, rect.top);
    const floor = new Graphics()
      .rect(0, 0, rect.right - rect.left, rect.bottom - rect.top)
      .fill({ color: colors.floor.rgb, alpha: colors.floor.alpha });
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
    this.container.addChild(floor, this.name);
  }

  /** Follow the zoom: the name keeps its size on screen. */
  follow(zoom: number): void {
    this.name.scale.set(NAME_PX / (TEXT_PX * zoom));
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
