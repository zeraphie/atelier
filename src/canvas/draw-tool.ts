/**
 * ─ Draw tool ─
 *
 * The Room tool: a press on empty ground begins a room in the cell
 * under it, the drag spans whole metres to the cell under the pointer,
 * and a ghost shows the span with its measure. The span grows only
 * over free ground: with the pointer over a room, the ghost stays
 * where it last fit. Release draws the room as one edit; a press let
 * go in its own cell draws nothing, so a click is not a room but a tap
 * on the ground, and a room is two cells at least. Escape drops it.
 * Decision: DECISIONS.md, rooms stay on the metre grid.
 */

import type { PointerSessionOwner } from "../camera/pointer-session.js";
import type { Point } from "../geometry.js";
import { cellAt, overlaps, spanOf, type Cell } from "../gallery/draw.js";
import { roomAt, type Plan } from "../gallery/hang.js";
import { cellsOf } from "../gallery/resize.js";
import type { Cells } from "../gallery/works.js";

/** What the drag shows while it lasts: the span so far, and its measure by the pointer. */
export interface DrawPreview {
  readonly cells: Cells;
  readonly label: { readonly text: string; readonly at: Point };
}

export interface DrawToolDeps {
  readonly plan: () => Plan;
  /** One cell of the grid, in world units. */
  readonly unitCm: number;
  readonly preview: (shown: DrawPreview | undefined) => void;
  /** The edit itself, once the room is let go. */
  readonly draw: (cells: Cells) => void;
  /** A press let go in its own cell: a click on the ground, which draws nothing. */
  readonly tapped: () => void;
  /** The host, told while a room is drawn so the cursor can say so. */
  readonly host: HTMLElement;
}

interface Held {
  readonly from: Cell;
  readonly others: readonly Cells[];
  /** The last span that lay over free ground. */
  span: Cells;
}

export class DrawTool implements PointerSessionOwner {
  private readonly deps: DrawToolDeps;
  private held: Held | undefined;

  constructor(deps: DrawToolDeps) {
    this.deps = deps;
  }

  takes(at: Point): boolean {
    return roomAt(this.deps.plan(), at) === undefined;
  }

  onDown(at: Point): boolean {
    const plan = this.deps.plan();
    if (roomAt(plan, at) !== undefined) {
      return false;
    }
    const from = cellAt(at, this.deps.unitCm);
    const others = plan.rooms.map((room) => cellsOf(room.room));
    const span = spanOf(from, from);
    if (overlaps(span, others)) {
      return false;
    }
    this.held = { from, others, span };
    this.deps.host.dataset["camera"] = "drawing";
    return true;
  }

  onMove(at: Point): void {
    if (this.held !== undefined) {
      this.track(at);
      this.deps.preview(previewOf(this.held.span, at));
    }
  }

  onUp(at: Point): void {
    const held = this.held;
    if (held === undefined) {
      return;
    }
    this.track(at);
    this.letGo();
    this.deps.preview(undefined);
    if (held.span.columns * held.span.rows > 1) {
      this.deps.draw(held.span);
    } else {
      this.deps.tapped();
    }
  }

  onCancel(): void {
    if (this.held !== undefined) {
      this.letGo();
      this.deps.preview(undefined);
    }
  }

  // The span to the cell under the pointer, kept where it was if that would lie over a room.
  private track(at: Point): void {
    const held = this.held!;
    const span = spanOf(held.from, cellAt(at, this.deps.unitCm));
    if (!overlaps(span, held.others)) {
      held.span = span;
    }
  }

  private letGo(): void {
    this.held = undefined;
    delete this.deps.host.dataset["camera"];
  }
}

function previewOf(cells: Cells, at: Point): DrawPreview {
  return { cells, label: { text: `${cells.columns} × ${cells.rows} m`, at } };
}
