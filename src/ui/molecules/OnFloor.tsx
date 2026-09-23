/**
 * ─ On floor ─
 *
 * A panel laid on the floor: a card at a world point by its top-left
 * corner, as wide as it says in centimetres, moved and scaled by the
 * camera like everything else in the world. From the plan it is a
 * small card in its room; up close it is a panel to read. Its contents
 * are laid out at a width in pixels, the centimetre per pixel unless
 * told otherwise, so a form laid out like a card can sit on a desk
 * narrower than the card. The desk and the plaque are this.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import type { ComponentProps } from "react";
import { worldToScreen, type CameraState } from "../../camera/index.js";
import type { Point } from "../../geometry.js";
import { Card } from "../atoms/Card.js";

interface OnFloorProps extends ComponentProps<"section"> {
  readonly camera: CameraState;
  /** The top-left corner, in world units. */
  readonly at: Point;
  readonly widthCm: number;
  /** The width the contents are laid out at, in pixels, scaled to fit `widthCm`; one per centimetre by default. */
  readonly layoutPx?: number;
}

/** A card at a world point, as wide as it says in centimetres, scaled by the camera. */
export function OnFloor({
  camera,
  at,
  widthCm,
  layoutPx = widthCm,
  className = "",
  ...props
}: OnFloorProps) {
  const screen = worldToScreen(camera, at);
  const scale = (camera.zoom * widthCm) / layoutPx;
  return (
    <Card
      className={`absolute top-0 left-0 origin-top-left ${className}`}
      style={{
        width: layoutPx,
        transform: `translate(${screen.x}px, ${screen.y}px) scale(${scale})`,
      }}
      {...props}
    />
  );
}
