import { useCameraState, useCanvas, useViewSize } from "./canvas-context.js";

// A quarter per press, the step Figma's zoom buttons take.
const ZOOM_STEP = 1.25;

const BUTTON =
  "h-8 min-w-8 px-2 font-mono text-sm text-ink hover:bg-canvas active:bg-line " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";

/** The zoom as a percentage, with a step either way, and the figure itself resets to life size. */
export function ZoomIndicator() {
  const { camera } = useCanvas();
  const { zoom } = useCameraState();
  const size = useViewSize();
  const centre = { x: size.width / 2, y: size.height / 2 };
  const percent = Math.round(zoom * 100);

  return (
    <div className="absolute right-4 bottom-4 flex overflow-hidden rounded-md border border-line bg-surface shadow-sm">
      <button
        type="button"
        className={BUTTON}
        aria-label="Zoom out"
        onClick={() => camera.zoomAt(centre, 1 / ZOOM_STEP)}
      >
        &minus;
      </button>
      <button
        type="button"
        className={`${BUTTON} border-x border-line tabular-nums`}
        aria-label={`Zoom ${percent} percent. Reset to 100 percent`}
        onClick={() => camera.zoomAt(centre, 1 / zoom)}
      >
        {percent}%
      </button>
      <button
        type="button"
        className={BUTTON}
        aria-label="Zoom in"
        onClick={() => camera.zoomAt(centre, ZOOM_STEP)}
      >
        +
      </button>
    </div>
  );
}
