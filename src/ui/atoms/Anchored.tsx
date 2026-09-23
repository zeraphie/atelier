/**
 * ─ Anchored ─
 *
 * A panel laid on the floor: a card at a world point by its top-left
 * corner, as wide as it says in centimetres, moved and scaled by the
 * camera like everything else in the world. From the plan it is a
 * small card in its room; up close it is a panel to read. The desk
 * and the plaque are this.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import type { ComponentProps } from "react";
import { worldToScreen, type CameraState, type Point } from "../../camera/index.js";
import { Card } from "./Card.js";

interface AnchoredProps extends ComponentProps<"section"> {
  readonly camera: CameraState;
  /** The top-left corner, in world units. */
  readonly at: Point;
  readonly widthCm: number;
}

export function Anchored({ camera, at, widthCm, className = "", ...props }: AnchoredProps) {
  const screen = worldToScreen(camera, at);
  return (
    <Card
      className={`absolute top-0 left-0 origin-top-left ${className}`}
      style={{
        width: widthCm,
        transform: `translate(${screen.x}px, ${screen.y}px) scale(${camera.zoom})`,
      }}
      {...props}
    />
  );
}
