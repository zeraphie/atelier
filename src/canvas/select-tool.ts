/**
 * ─ Select tool ─
 *
 * Part of Move: a Ctrl click, Command on a Mac, on a room drawn here
 * picks it, or lets it go if picked, so several can be removed
 * together. The press is never held, so nothing drags; a Ctrl click
 * anywhere else is not the tool's and goes on as any press would.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import type { PointerSessionOwner } from "../camera/pointer-session.js";
import type { Point } from "../geometry.js";
import { roomAt, type Plan } from "../gallery/hang.js";

export interface SelectToolDeps {
  readonly plan: () => Plan;
  /** Pick the room, or let it go if picked. */
  readonly toggle: (roomId: string) => void;
}

export class SelectTool implements PointerSessionOwner {
  private readonly deps: SelectToolDeps;

  constructor(deps: SelectToolDeps) {
    this.deps = deps;
  }

  takes(at: Point, event: PointerEvent): boolean {
    return (event.ctrlKey || event.metaKey) && this.drawnAt(at) !== undefined;
  }

  onDown(at: Point): boolean {
    const id = this.drawnAt(at);
    if (id !== undefined) {
      this.deps.toggle(id);
    }
    // The pick is done on the press; nothing is held.
    return false;
  }

  onMove(): void {
    // Never held, so never moved.
  }

  onUp(): void {
    // Never held, so never let go.
  }

  onCancel(): void {
    // Never held, so nothing to cancel.
  }

  // The id of the drawn room under a point, if any.
  private drawnAt(at: Point): string | undefined {
    const room = roomAt(this.deps.plan(), at);
    return room?.room.drawn === true ? room.room.id : undefined;
  }
}
