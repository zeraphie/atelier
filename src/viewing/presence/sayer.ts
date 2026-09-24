/**
 * ─ Sayer ─
 *
 * Says a thing to the peers at the pace of the screen: once a frame at
 * most, however often it changed, and only when what would be said
 * differs from what was said last; that it is gone is said once, and
 * never before anything was. The pointer and the view are said this
 * way, each by a sayer of its own. Pure, so the pace is tested without
 * a browser.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { FrameScheduler } from "../../canvas/frame-scheduler.js";

export class Sayer<T> {
  private latest: T | undefined;
  /** What was said last: nothing yet, a value, or that it is gone. */
  private said: T | null | undefined;
  private readonly frames: FrameScheduler;
  private readonly send: (value: T | null) => void;
  private readonly isSame: (a: T, b: T) => boolean;

  /** `refresh` runs its callback at the next screen refresh; `send` is the saying; `isSame` says when two values are one. */
  constructor(
    refresh: (tell: () => void) => void,
    send: (value: T | null) => void,
    isSame: (a: T, b: T) => boolean
  ) {
    this.send = send;
    this.isSame = isSame;
    this.frames = new FrameScheduler(refresh, () => this.flush());
  }

  /** The thing is `value` now, or, with nothing, gone. */
  say(value: T | undefined): void {
    this.latest = value;
    this.frames.ask();
  }

  /** Say the latest again whatever was said, as to a peer who just arrived. */
  sayAgain(): void {
    this.said = undefined;
    this.frames.ask();
  }

  private flush(): void {
    const next = this.latest ?? null;
    if (this.isUnchanged(next)) {
      return;
    }
    this.said = next;
    this.send(next);
  }

  private isUnchanged(next: T | null): boolean {
    if (this.said === undefined) {
      return next === null;
    }
    if (this.said === null || next === null) {
      return this.said === next;
    }
    return this.isSame(this.said, next);
  }
}
