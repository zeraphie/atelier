/**
 * ─ Placed ─
 *
 * A thing in the DOM overlay at a screen point, by its centre. The
 * point comes from the camera as a transform, the one style the rules
 * allow inline, and it lives on this wrapper alone: a hover scale on
 * the placed thing itself would compose with that translate about the
 * thing's own box, which the translate has left far behind, and throw
 * it a tenth of the way across the screen.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import type { ReactNode } from "react";
import type { Point } from "../camera/index.js";

export function Placed({ at, children }: { readonly at: Point; readonly children: ReactNode }) {
  return (
    <div
      className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2"
      style={{ transform: `translate(${at.x}px, ${at.y}px)` }}
    >
      {children}
    </div>
  );
}
