/**
 * ─ Resize tool ─
 *
 * Part of Move: a press near a room's wall takes hold of the wall, the
 * drag carries it with the pointer as far as the grid and the other
 * rooms allow, and a ghost shows the metre line it will settle on. On
 * release the wall glides to the ghost and the room is resized as one
 * edit; until then the plan is untouched and only a preview is drawn.
 * Escape puts the wall back.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import { eased, type Frame } from "../camera/glide.js";
import type { PointerSessionOwner } from "../camera/pointer-session.js";
import type { Point } from "../geometry.js";
import type { Plan, Side } from "../gallery/hang.js";
import {
  cellsOf,
  clamped,
  limitsOf,
  lineOf,
  wallNear,
  withSide,
  type Limits,
} from "../gallery/resize.js";
import type { Cells } from "../gallery/works.js";

/** What the drag shows while it lasts. */
export interface ResizePreview {
  readonly roomId: string;
  /** The room with its wall where the pointer has it, between the grid's lines. */
  readonly dragged: Cells;
  /** The room with its wall on the metre line it will settle on. */
  readonly ghost: Cells;
  /** The ghost's new measure, for a badge by the pointer. */
  readonly label: { readonly text: string; readonly at: Point };
}

export interface ResizeToolDeps {
  readonly plan: () => Plan;
  /** One cell of the grid, in world units. */
  readonly unitCm: number;
  /** How near a wall a press must be, in world units, as the zoom stands. */
  readonly reachCm: () => number;
  readonly preview: (shown: ResizePreview | undefined) => void;
  /** The edit itself, once the wall has settled. */
  readonly resize: (roomId: string, cells: Cells) => void;
  /** The host, told while a wall is held so the cursor can say so. */
  readonly host: HTMLElement;
  readonly isMotionReduced: () => boolean;
  readonly frame: Frame;
}

/** How long the wall takes to settle on its metre line. */
export const SETTLE_MS = 150;

interface Held {
  readonly roomId: string;
  readonly side: Side;
  readonly cells: Cells;
  readonly limits: Limits;
  /** Where the wall is, in grid lines, as the pointer has it. */
  line: number;
  at: Point;
}

export class ResizeTool implements PointerSessionOwner {
  private readonly deps: ResizeToolDeps;
  private held: Held | undefined;
  private stopSettling: (() => void) | undefined;

  constructor(deps: ResizeToolDeps) {
    this.deps = deps;
  }

  takes(at: Point): boolean {
    return wallNear(this.deps.plan(), at, this.deps.reachCm()) !== undefined;
  }

  onDown(at: Point): boolean {
    // A wall still settling lands first, so the plan is whole before the next drag.
    this.stopSettling?.();
    const plan = this.deps.plan();
    const hit = wallNear(plan, at, this.deps.reachCm());
    if (hit === undefined) {
      return false;
    }
    const cells = cellsOf(hit.room.room);
    const others = plan.rooms.filter((room) => room !== hit.room).map((room) => cellsOf(room.room));
    this.held = {
      roomId: hit.room.room.id,
      side: hit.side,
      cells,
      limits: limitsOf(cells, hit.side, others),
      line: lineOf(cells, hit.side),
      at,
    };
    this.deps.host.dataset["camera"] = "resizing";
    return true;
  }

  onMove(at: Point): void {
    if (this.held !== undefined) {
      this.track(at);
      this.deps.preview(previewOf(this.held, this.held.line, Math.round(this.held.line)));
    }
  }

  onUp(at: Point): void {
    const held = this.held;
    if (held === undefined) {
      return;
    }
    this.track(at);
    this.letGo();
    const to = Math.round(held.line);
    const settled = withSide(held.cells, held.side, to);
    const land = (): void => {
      this.stopSettling = undefined;
      this.deps.preview(undefined);
      if (!isSame(settled, held.cells)) {
        this.deps.resize(held.roomId, settled);
      }
    };
    if (held.line === to || this.deps.isMotionReduced()) {
      land();
      return;
    }
    // The glide: the wall from where the pointer left it to its line, eased.
    const from = held.line;
    let start: number | undefined;
    let isStopped = false;
    const tick = (time: number): void => {
      if (isStopped) {
        return;
      }
      start ??= time;
      const t = Math.min(1, (time - start) / SETTLE_MS);
      this.deps.preview(previewOf(held, from + (to - from) * eased(t), to));
      if (t < 1) {
        this.deps.frame(tick);
      } else {
        land();
      }
    };
    this.stopSettling = () => {
      isStopped = true;
      land();
    };
    this.deps.frame(tick);
  }

  onCancel(): void {
    if (this.held !== undefined) {
      this.letGo();
      this.deps.preview(undefined);
    }
  }

  /** Nothing more drawn or resized: the canvas is going away. */
  dispose(): void {
    this.stopSettling = undefined;
    this.held = undefined;
  }

  // The wall to the pointer, held within its limits.
  private track(at: Point): void {
    const held = this.held!;
    const coordinate = held.side === "left" || held.side === "right" ? at.x : at.y;
    held.line = clamped(coordinate / this.deps.unitCm, held.limits);
    held.at = at;
  }

  private letGo(): void {
    this.held = undefined;
    delete this.deps.host.dataset["camera"];
  }
}

function previewOf(held: Held, line: number, ghostLine: number): ResizePreview {
  const ghost = withSide(held.cells, held.side, ghostLine);
  const measure = held.side === "left" || held.side === "right" ? ghost.columns : ghost.rows;
  return {
    roomId: held.roomId,
    dragged: withSide(held.cells, held.side, line),
    ghost,
    label: { text: `${measure} m`, at: held.at },
  };
}

function isSame(a: Cells, b: Cells): boolean {
  return a.column === b.column && a.row === b.row && a.columns === b.columns && a.rows === b.rows;
}
