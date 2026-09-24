/**
 * ─ Pointer session ─
 *
 * One press held on the canvas at a time, as an edit tool takes it:
 * the left button is claimed before the host can pan, captured so the
 * drag keeps reporting off the canvas, and let go on release or
 * cancel. The owner hears world points and decides what they mean;
 * a press it does not take goes on to the camera as it always did.
 * The idea, and most of the shape, are tablewright's.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import type { Point } from "../../geometry.js";
import { HeldPress } from "./held-press.js";
import { pointOn } from "./point-on.js";

/** What a tool does with the pointer the session hands it. */
export interface PointerSessionOwner {
  /** Whether a left press at `at` is the owner's at all; refused, it goes to the camera. */
  takes(at: Point, event: PointerEvent): boolean;
  /** A press taken at `at`; answer whether to hold the pointer until it is let go. */
  onDown(at: Point, event: PointerEvent): boolean;
  /** The held pointer moved. */
  onMove(at: Point, event: PointerEvent): void;
  /** The held pointer was let go at `at`; the session releases it afterwards. */
  onUp(at: Point, event: PointerEvent): void;
  /** The held pointer was taken away, or Escape was pressed; the session has released it. */
  onCancel(): void;
}

/** Binds a tool's pointer handling to `canvas` while active. */
export class PointerSession {
  private readonly canvas: HTMLElement;
  private readonly toWorld: (screen: Point) => Point;
  private readonly owner: PointerSessionOwner;
  private isActive = false;
  private readonly press = new HeldPress();
  private pointerId: number | undefined;

  /** `toWorld` maps a point on the canvas to the world: the camera's inverse. */
  constructor(canvas: HTMLElement, toWorld: (screen: Point) => Point, owner: PointerSessionOwner) {
    this.canvas = canvas;
    this.toWorld = toWorld;
    this.owner = owner;
  }

  /** Whether the owner hears the pointer. Off, any press held is let go. */
  setActive(on: boolean): void {
    if (on === this.isActive) {
      return;
    }
    this.isActive = on;
    if (on) {
      this.canvas.addEventListener("pointerdown", this.onPointerDown);
      this.canvas.addEventListener("pointermove", this.onPointerMove);
      this.canvas.addEventListener("pointerup", this.onPointerUp);
      this.canvas.addEventListener("pointercancel", this.onPointerCancel);
      // Heard on the document on the way down, which a key reaches before
      // any listener on the window, so an Escape that cancels a drag is
      // marked handled before the shortcuts see it and does nothing else.
      document.addEventListener("keydown", this.onKeyDown, { capture: true });
    } else {
      this.canvas.removeEventListener("pointerdown", this.onPointerDown);
      this.canvas.removeEventListener("pointermove", this.onPointerMove);
      this.canvas.removeEventListener("pointerup", this.onPointerUp);
      this.canvas.removeEventListener("pointercancel", this.onPointerCancel);
      document.removeEventListener("keydown", this.onKeyDown, { capture: true });
      this.cancel();
    }
  }

  /** Whether a press is held. */
  get isHeld(): boolean {
    return this.press.isHeld;
  }

  dispose(): void {
    this.setActive(false);
  }

  // Let the held pointer go: its capture released and nothing more heard from it.
  private release(): void {
    const { pointerId } = this;
    if (this.press.let() && pointerId !== undefined && this.canvas.hasPointerCapture(pointerId)) {
      this.canvas.releasePointerCapture(pointerId);
    }
    this.pointerId = undefined;
  }

  private cancel(): void {
    if (!this.isHeld) {
      return;
    }
    this.release();
    this.owner.onCancel();
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    const at = this.worldUnder(event);
    const outcome = this.press.down(
      event.pointerId,
      event.button,
      () => this.owner.takes(at, event),
      () => this.owner.onDown(at, event)
    );
    if (outcome === "ignored" || outcome === "refused") {
      return;
    }
    // The press is the tool's; the host must not start a pan.
    event.stopPropagation();
    event.preventDefault();
    if (outcome === "held") {
      this.pointerId = event.pointerId;
      this.canvas.setPointerCapture(event.pointerId);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.press.is(event.pointerId)) {
      this.owner.onMove(this.worldUnder(event), event);
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (!this.press.is(event.pointerId)) {
      return;
    }
    this.owner.onUp(this.worldUnder(event), event);
    this.release();
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    if (this.press.is(event.pointerId)) {
      this.cancel();
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.isHeld) {
      event.preventDefault();
      this.cancel();
    }
  };

  // The canvas may sit anywhere on the page, so the point is read from its
  // own corner, then through the camera.
  private worldUnder(event: PointerEvent): Point {
    return this.toWorld(pointOn(this.canvas, event));
  }
}

/** One owner from several: the first whose `takes` says yes to a press owns it until it is let go. */
export function firstOf(...owners: readonly PointerSessionOwner[]): PointerSessionOwner {
  let holder: PointerSessionOwner | undefined;
  return {
    takes(at, event) {
      return owners.some((owner) => owner.takes(at, event));
    },
    onDown(at, event) {
      holder = owners.find((owner) => owner.takes(at, event));
      const isHeld = holder?.onDown(at, event) ?? false;
      if (!isHeld) {
        holder = undefined;
      }
      return isHeld;
    },
    onMove(at, event) {
      holder?.onMove(at, event);
    },
    onUp(at, event) {
      holder?.onUp(at, event);
      holder = undefined;
    },
    onCancel() {
      holder?.onCancel();
      holder = undefined;
    },
  };
}
