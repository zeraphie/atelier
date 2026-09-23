/**
 * ─ Point on ─
 *
 * Where a pointer landed on an element, as the screen point the camera
 * reads: CSS pixels from the element's top-left corner, whatever the
 * page has laid out or scrolled around it. Every listener on the
 * canvas or its host goes through this, so the subtraction is written
 * once.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import type { Point } from "../geometry.js";

/** A point in the page, as a pointer event carries it. */
export interface ClientPoint {
  readonly clientX: number;
  readonly clientY: number;
}

/** The point `at` lands on `element`, in CSS pixels from its top-left corner. */
export function pointOn(element: Element, at: ClientPoint): Point {
  const rect = element.getBoundingClientRect();
  return { x: at.clientX - rect.left, y: at.clientY - rect.top };
}
