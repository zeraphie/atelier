/**
 * ─ Door tool ─
 *
 * A click on a metre edge of a wall two rooms share puts their doorway
 * there, and a click on the doorway itself takes it away: one doorway
 * for each pair of rooms, and a room may have as many as it has
 * neighbours. The press is held until it is let go on the same edge,
 * so a press dragged off is nothing, and Escape drops it. A press
 * anywhere else is not the tool's and goes on as any press would.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import type { PointerSessionOwner } from "../camera/pointer-session.js";
import type { Point } from "../geometry.js";
import { doorAt, type DoorAction } from "../gallery/doors.js";
import { edgeKey, edgeNear, type Edge } from "../gallery/edges.js";
import type { Plan } from "../gallery/hang.js";

export interface DoorToolDeps {
  readonly plan: () => Plan;
  /** One cell of the grid, in world units. */
  readonly unitCm: number;
  /** How near an edge a press must be, in world units, as the zoom stands. */
  readonly reachCm: () => number;
  /** Put the pair's doorway on the edge. */
  readonly put: (pair: string, edge: Edge) => void;
  /** Take the pair's doorway away. */
  readonly take: (pair: string) => void;
}

export class DoorTool implements PointerSessionOwner {
  private readonly deps: DoorToolDeps;
  private held: DoorAction | undefined;

  constructor(deps: DoorToolDeps) {
    this.deps = deps;
  }

  /** What a click at `at` would do, for the hover to show; nothing off a shared wall. */
  actionAt(at: Point): DoorAction | undefined {
    const edge = edgeNear(at, this.deps.unitCm, this.deps.reachCm());
    return edge === undefined ? undefined : doorAt(this.deps.plan(), edge, this.deps.unitCm);
  }

  takes(at: Point): boolean {
    return this.actionAt(at) !== undefined;
  }

  onDown(at: Point): boolean {
    this.held = this.actionAt(at);
    return this.held !== undefined;
  }

  onMove(): void {
    // The click is judged where it is let go.
  }

  onUp(at: Point): void {
    const held = this.held;
    this.held = undefined;
    const action = this.actionAt(at);
    if (held === undefined || action === undefined || edgeKey(action.edge) !== edgeKey(held.edge)) {
      return;
    }
    if (action.isThere) {
      this.deps.take(action.pair.key);
    } else {
      this.deps.put(action.pair.key, action.edge);
    }
  }

  onCancel(): void {
    this.held = undefined;
  }
}
