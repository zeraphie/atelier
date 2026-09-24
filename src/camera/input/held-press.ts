/**
 * ─ Held press ─
 *
 * The one press a pointer session holds, and the rules around it: a
 * left press while nothing is held is offered to the owner, who may
 * refuse it, take it for a click, or hold it for a drag; only the
 * held pointer's later events are the press's; and letting go is
 * once. Pure, so the rules are tested without a canvas.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

const LEFT_BUTTON = 0;

/** What became of a press: not the session's, refused by the owner, taken for a click, or held for a drag. */
export type PressOutcome = "ignored" | "refused" | "taken" | "held";

export class HeldPress {
  private pointerId: number | undefined;

  /** Whether a press is held. */
  get isHeld(): boolean {
    return this.pointerId !== undefined;
  }

  /** A press by `pointerId` with `button`: offered to the owner when it is the left button and nothing is held. */
  down(
    pointerId: number,
    button: number,
    takes: () => boolean,
    holds: () => boolean
  ): PressOutcome {
    if (button !== LEFT_BUTTON || this.isHeld) {
      return "ignored";
    }
    if (!takes()) {
      return "refused";
    }
    if (!holds()) {
      return "taken";
    }
    this.pointerId = pointerId;
    return "held";
  }

  /** Whether an event by `pointerId` is the held press's. */
  is(pointerId: number): boolean {
    return this.pointerId !== undefined && this.pointerId === pointerId;
  }

  /** Let the held press go; whether there was one to let go. */
  let(): boolean {
    if (!this.isHeld) {
      return false;
    }
    this.pointerId = undefined;
    return true;
  }
}
