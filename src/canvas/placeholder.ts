// Stands in for the gallery: three frames hung on one line, in centimetres,
// so the camera has something to move over before there are works.

import { Graphics, type Container } from "pixi.js";
import type { WorldRect } from "../camera/index.js";
import type { PackedColor } from "./css-color.js";

interface Frame {
  readonly x: number;
  readonly width: number;
  readonly height: number;
}

// Widths and heights a small gallery might hang, centred on the line at y = 0.
const FRAMES: readonly Frame[] = [
  { x: 0, width: 90, height: 120 },
  { x: 150, width: 160, height: 110 },
  { x: 370, width: 70, height: 70 },
];
const MARGIN = 40;

export interface StandIn {
  /** The wall's extent, with a margin, for the camera to fit. */
  readonly bounds: WorldRect;
  dispose(): void;
}

/** Draw the stand-in wall into `world` in `color`. */
export function standInWall(world: Container, color: PackedColor): StandIn {
  const shapes = new Graphics({ label: "stand-in" });
  for (const frame of FRAMES) {
    shapes
      .rect(frame.x, -frame.height / 2, frame.width, frame.height)
      .fill({ color: color.rgb, alpha: 0.08 })
      // A hairline at every zoom, so the outline never thickens into a border.
      .stroke({ color: color.rgb, alpha: 0.6, width: 1, pixelLine: true });
  }
  world.addChild(shapes);
  const last = FRAMES[FRAMES.length - 1];
  const tallest = Math.max(...FRAMES.map((frame) => frame.height));
  return {
    bounds: {
      left: -MARGIN,
      top: -tallest / 2 - MARGIN,
      right: (last === undefined ? 0 : last.x + last.width) + MARGIN,
      bottom: tallest / 2 + MARGIN,
    },
    dispose() {
      shapes.destroy();
    },
  };
}
