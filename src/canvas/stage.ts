/**
 * ─ Stage ─
 *
 * Owns the Pixi application, the canvas element inside its host, and
 * the world container that everything in world space hangs below.
 * The stage follows the camera by subscription: each change lands on
 * the world as position and scale and asks for a frame. It draws on
 * request: its ticker never runs, and a frame comes only when
 * something asks. Text is a texture the world magnifies, so once the
 * zoom settles every piece is drawn again at that scale.
 * Decision: DECISIONS.md, the canvas draws on request.
 */

import { Application, Container, Text } from "pixi.js";
import type { Camera, CameraState, ViewSize } from "../camera/index.js";
import { FrameScheduler } from "./frame-scheduler.js";

// How long after the last change of scale the text is drawn again, and how
// far the scale has to have moved to be worth it: an eighth of a doubling,
// which is about the point the eye starts to notice.
const SETTLE_MS = 160;
const SCALE_STEP = 0.125;
// Four times the device's own pixels. A texture grows with the square of
// this, and past here nobody is reading the canvas anyway.
const MAX_TEXT_RESOLUTION = 4;

/** Draw every piece of text under `root` again at `resolution`. */
function sharpen(root: Container, resolution: number): void {
  for (const child of root.children) {
    if (child instanceof Text) {
      if (child.resolution !== resolution) {
        child.resolution = resolution;
      }
    } else if (child instanceof Container) {
      sharpen(child, resolution);
    }
  }
}

/** A transparent, full-size Pixi canvas inside a host element, resized and DPR-corrected automatically. */
export class Stage {
  readonly app: Application;
  /** The camera's transform lands here; everything in world space hangs below it. */
  readonly world: Container;
  /** Resolves once the first frame has been drawn, for a curtain that waits on it. */
  readonly firstFrame: Promise<void>;
  private readonly host: HTMLElement;
  private readonly scheduler: FrameScheduler;
  private readonly resizeObserver: ResizeObserver;
  private readonly resizeListeners = new Set<() => void>();
  private readonly stopFollowing: () => void;
  private resolveFirstFrame: () => void = () => {};
  private dprQuery: MediaQueryList | undefined;
  private sharpenAt: ReturnType<typeof setTimeout> | undefined;
  private sharpenedFor = 0;

  private constructor(app: Application, host: HTMLElement, camera: Camera) {
    this.app = app;
    this.host = host;
    this.world = new Container({ label: "world" });
    app.stage.addChild(this.world);
    this.firstFrame = new Promise((resolve) => {
      this.resolveFirstFrame = resolve;
    });
    this.scheduler = new FrameScheduler(
      (draw) => {
        requestAnimationFrame(draw);
      },
      () => this.draw()
    );
    this.stopFollowing = camera.onChange(this.follow);
    this.follow(camera.current);
    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(host);
    this.watchDpr();
  }

  /** Create the Pixi application inside `host`, attach its canvas, and follow `camera`. */
  static async create(host: HTMLElement, camera: Camera): Promise<Stage> {
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
    return new Stage(app, host, camera);
  }

  /** Stop drawing, detach the canvas, and release the world and the GPU resources. */
  destroy(): void {
    clearTimeout(this.sharpenAt);
    this.scheduler.dispose();
    this.stopFollowing();
    this.resizeObserver.disconnect();
    this.dprQuery?.removeEventListener("change", this.onDprChange);
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

  // The camera state is exactly a container's position and scale.
  private readonly follow = (state: CameraState): void => {
    this.world.position.set(state.x, state.y);
    this.world.scale.set(state.zoom);
    this.requestFrame();
  };

  private draw(): void {
    this.app.render();
    this.resolveFirstFrame();
    this.watchScale();
  }

  // Every piece redraws at once, so never mid-gesture: only once the zoom has rested.
  private watchScale(): void {
    const wanted = this.world.scale.x;
    if (Math.abs(Math.log2(wanted / this.sharpenedFor)) < SCALE_STEP) {
      return;
    }
    clearTimeout(this.sharpenAt);
    this.sharpenAt = setTimeout(() => {
      this.sharpenedFor = this.world.scale.x;
      const resolution = Math.min(
        MAX_TEXT_RESOLUTION,
        Math.max(1, this.sharpenedFor) * window.devicePixelRatio
      );
      sharpen(this.world, resolution);
      this.requestFrame();
    }, SETTLE_MS);
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
