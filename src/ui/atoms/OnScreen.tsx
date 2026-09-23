/**
 * ─ On screen ─
 *
 * A thing in the DOM overlay at a screen point, by its centre or by
 * its top-left corner. The point comes from the camera as a
 * transform, the one style the rules allow inline, and it lives on
 * this wrapper alone: a hover scale on the placed thing itself would
 * compose with that translate about the thing's own box, which the
 * translate has left far behind, and throw it a tenth of the way
 * across the screen. Custom properties the thing reads may ride on
 * the wrapper too.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import type { CSSProperties, ReactNode } from "react";
import type { Point } from "../../geometry.js";

/** A thing in the DOM overlay at a screen point: by its centre, or, anchored at the corner, by its top-left. */
export function OnScreen({
  at,
  anchor = "centre",
  className = "",
  style,
  children,
}: {
  readonly at: Point;
  readonly anchor?: "centre" | "corner";
  readonly className?: string;
  /** Custom properties for the thing inside; the transform is the wrapper's own. */
  readonly style?: CSSProperties;
  readonly children: ReactNode;
}) {
  const centred = anchor === "centre" ? "-translate-x-1/2 -translate-y-1/2" : "";
  return (
    <div
      className={`absolute top-0 left-0 ${centred} ${className}`}
      style={{ ...style, transform: `translate(${at.x}px, ${at.y}px)` }}
    >
      {children}
    </div>
  );
}
