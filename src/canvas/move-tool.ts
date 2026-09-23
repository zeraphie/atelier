/**
 * ─ Move tool ─
 *
 * The rest of edit mode: a press on a picture takes hold of it, the
 * drag carries it with its plaque by the offset the press had from
 * its centre, and the release puts it down as one edit. While it is
 * held the view is only nudged, so the plan is derived once, at the
 * end, not once a frame. A press on nothing is not the tool's, and
 * the camera pans as ever.
 * Decision: DECISIONS.md, the wall is curated by default, yours to rearrange here.
 */

import type { PointerSessionOwner } from "../camera/pointer-session.js";
import type { Point } from "../geometry.js";
import type { Plan } from "../gallery/hang.js";
import { targetAt } from "../gallery/targets.js";
import type { Work } from "../gallery/works.js";

export interface MoveToolDeps {
  readonly plan: () => Plan;
  /** Whether this person may move a work: not another's picture. */
  readonly mayHandle: (work: Work) => boolean;
  /** Show a work at a centre without changing anything: the drag's preview. */
  readonly nudge: (workId: string, centre: Point) => void;
  /** The edit itself, once the picture is put down. */
  readonly move: (workId: string, centre: Point) => void;
  /** The host, told while a picture is held so the cursor can say so. */
  readonly host: HTMLElement;
}

interface Held {
  readonly id: string;
  /** From the press to the picture's centre, so it does not jump under the pointer. */
  readonly offset: Point;
  readonly from: Point;
}

export class MoveTool implements PointerSessionOwner {
  private readonly deps: MoveToolDeps;
  private held: Held | undefined;

  constructor(deps: MoveToolDeps) {
    this.deps = deps;
  }

  takes(at: Point): boolean {
    const target = targetAt(this.deps.plan(), at);
    return target.kind === "work" && this.deps.mayHandle(target.work.work);
  }

  onDown(at: Point): boolean {
    const target = targetAt(this.deps.plan(), at);
    if (target.kind !== "work" || !this.deps.mayHandle(target.work.work)) {
      return false;
    }
    const { rect } = target.work;
    const from = { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
    this.held = { id: target.work.work.id, offset: { x: from.x - at.x, y: from.y - at.y }, from };
    this.deps.host.dataset["camera"] = "moving";
    return true;
  }

  onMove(at: Point): void {
    if (this.held !== undefined) {
      this.deps.nudge(this.held.id, this.centreFor(at));
    }
  }

  onUp(at: Point): void {
    if (this.held === undefined) {
      return;
    }
    this.deps.move(this.held.id, this.centreFor(at));
    this.letGo();
  }

  onCancel(): void {
    if (this.held !== undefined) {
      this.deps.nudge(this.held.id, this.held.from);
      this.letGo();
    }
  }

  private centreFor(at: Point): Point {
    const { offset } = this.held!;
    return { x: at.x + offset.x, y: at.y + offset.y };
  }

  private letGo(): void {
    this.held = undefined;
    delete this.deps.host.dataset["camera"];
  }
}
