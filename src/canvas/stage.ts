/**
 * ─ Stage ─
 *
 * Owns the Pixi application and the canvas element inside its host.
 * The world container it is handed is the one thing the camera
 * moves; the stage adopts it and gives it back on destroy, so the
 * world outlives any one canvas. The stage draws on request: its
 * ticker never runs, and a frame comes only when something asks.
 * Decision: DECISIONS.md, the canvas draws on request.
 */

import { Application, type Container } from "pixi.js";
import type { ViewSize } from "../camera/index.js";
import { FrameScheduler } from "./frame-scheduler.js";

/** A transparent, full-size Pixi canvas inside a host element, resized and DPR-corrected automatically. */
export class Stage {
  readonly app: Application;
  /** The camera applies its transform here; everything in world space hangs below it. */
  readonly world: Container;
  /** Resolves once the first frame has been drawn, for a curtain that waits on it. */
  readonly firstFrame: Promise<void>;
  private readonly host: HTMLElement;
  private readonly scheduler: FrameScheduler;
  private readonly resizeObserver: ResizeObserver;
  private readonly resizeListeners = new Set<() => void>();
  private resolveFirstFrame: () => void = () => {};
  private dprQuery: MediaQueryList | undefined;

  private constructor(app: Application, host: HTMLElement, world: Container) {
    this.app = app;
    this.host = host;
    this.world = world;
    app.stage.addChild(world);
    this.firstFrame = new Promise((resolve) => {
      this.resolveFirstFrame = resolve;
    });
    this.scheduler = new FrameScheduler(
      (draw) => {
        requestAnimationFrame(draw);
      },
      () => this.draw()
    );
    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(host);
    this.watchDpr();
    // The stage asks for its own first frame, so a host that waits on it
    // never waits on a change that has yet to come.
    this.requestFrame();
  }

  /** Create the Pixi application inside `host`, attach its canvas, and adopt `world`. */
  static async create(host: HTMLElement, world: Container): Promise<Stage> {
    const app = new Application();
    await app.init({
      // WebGL: one code path on every machine, and enough for what the canvas draws.
      preference: "webgl",
      // The ticker never runs: a frame is drawn when asked for, never on a loop.
      autoStart: false,
      // The ground is the host's CSS, so the canvas paints nothing behind the world.
      backgroundAlpha: 0,
      width: host.clientWidth,
      height: host.clientHeight,
      resolution: window.devicePixelRatio,
      autoDensity: true,
      antialias: true,
    });
    host.appendChild(app.canvas);
    return new Stage(app, host, world);
  }

  /** Stop drawing, hand the world back, detach the canvas, and release GPU resources. */
  destroy(): void {
    this.scheduler.dispose();
    this.resizeObserver.disconnect();
    this.dprQuery?.removeEventListener("change", this.onDprChange);
    this.app.stage.removeChild(this.world);
    this.app.destroy({ removeView: true }, { children: true });
  }

  /** Ask for a frame: drawn at the next screen refresh, together with every other ask until then. */
  requestFrame(): void {
    this.scheduler.ask();
  }

  /** Frames drawn since the stage was made; still while nothing changes. */
  get framesDrawn(): number {
    return this.scheduler.framesDrawn;
  }

  /** The canvas size in CSS pixels. */
  get view(): ViewSize {
    return { width: this.host.clientWidth, height: this.host.clientHeight };
  }

  /** Subscribe to canvas size changes; returns the unsubscribe function. */
  onResize(listener: () => void): () => void {
    this.resizeListeners.add(listener);
    return () => {
      this.resizeListeners.delete(listener);
    };
  }

  private draw(): void {
    this.app.render();
    this.resolveFirstFrame();
  }

  private fit(): void {
    this.app.renderer.resize(
      this.host.clientWidth,
      this.host.clientHeight,
      window.devicePixelRatio
    );
    for (const listener of this.resizeListeners) {
      listener();
    }
    // Resizing blanks the canvas, so this frame cannot wait for the next refresh.
    this.scheduler.drawNow();
  }

  // A media query matching the current ratio fires once when the window moves
  // to a display with a different one; re-arm it for the new ratio each time.
  private watchDpr(): void {
    this.dprQuery?.removeEventListener("change", this.onDprChange);
    this.dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    this.dprQuery.addEventListener("change", this.onDprChange);
  }

  private readonly onDprChange = (): void => {
    this.fit();
    this.watchDpr();
  };
}
