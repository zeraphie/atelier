/**
 * ─ Scale tool ─
 *
 * Part of Move: a press on a corner of a picture of your own takes
 * hold of the corner, the drag draws the picture out or in with the
 * opposite corner held still and its proportions kept, and the
 * release keeps the new size and place as one edit. While it is held
 * the view is only stretched, so the plan is derived once, at the end.
 * Decision: DECISIONS.md, a picture and its hanging are two things.
 */

import type { PointerSessionOwner } from "../camera/pointer-session.js";
import type { Point, WorldRect } from "../geometry.js";
import type { Plan } from "../gallery/hang.js";
import { cornerNear, scaled, type Corner } from "../gallery/scale.js";

export interface ScaleToolDeps {
  readonly plan: () => Plan;
  /** How near a corner a press must be, in world units, as the zoom stands. */
  readonly reachCm: () => number;
  /** Show a picture over a rect without changing anything: the drag's preview; none puts it back. */
  readonly stretch: (workId: string, rect: WorldRect | undefined) => void;
  /** The edit itself: the picture's new centre and width. */
  readonly resize: (workId: string, centre: Point, widthCm: number) => void;
  /** The host, told while a corner is held so the cursor can say so. */
  readonly host: HTMLElement;
}

/** How narrow a picture may be dragged, in centimetres. */
export const LEAST_WIDTH_CM = 10;

interface Held {
  readonly id: string;
  readonly rect: WorldRect;
  readonly corner: Corner;
  shown: WorldRect;
}

export class ScaleTool implements PointerSessionOwner {
  private readonly deps: ScaleToolDeps;
  private held: Held | undefined;

  constructor(deps: ScaleToolDeps) {
    this.deps = deps;
  }

  takes(at: Point): boolean {
    return cornerNear(this.deps.plan(), at, this.deps.reachCm()) !== undefined;
  }

  onDown(at: Point): boolean {
    const hit = cornerNear(this.deps.plan(), at, this.deps.reachCm());
    if (hit === undefined) {
      return false;
    }
    this.held = {
      id: hit.work.work.id,
      rect: hit.work.rect,
      corner: hit.corner,
      shown: hit.work.rect,
    };
    this.deps.host.dataset["camera"] = "scaling";
    return true;
  }

  onMove(at: Point): void {
    if (this.held !== undefined) {
      this.held.shown = scaled(this.held.rect, this.held.corner, at, LEAST_WIDTH_CM);
      this.deps.stretch(this.held.id, this.held.shown);
    }
  }

  onUp(at: Point): void {
    const held = this.held;
    if (held === undefined) {
      return;
    }
    this.onMove(at);
    this.letGo();
    this.deps.stretch(held.id, undefined);
    const { shown, rect } = held;
    if (shown.left !== rect.left || shown.right !== rect.right || shown.top !== rect.top) {
      const centre = { x: (shown.left + shown.right) / 2, y: (shown.top + shown.bottom) / 2 };
      this.deps.resize(held.id, centre, Math.round((shown.right - shown.left) * 10) / 10);
    }
  }

  onCancel(): void {
    if (this.held !== undefined) {
      this.deps.stretch(this.held.id, undefined);
      this.letGo();
    }
  }

  private letGo(): void {
    this.held = undefined;
    delete this.deps.host.dataset["camera"];
  }
}
