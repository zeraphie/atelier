/**
 * ─ Zoom indicator ─
 *
 * The zoom as a percentage, with a step either way, and the figure
 * itself resets to life size. The steps work about the middle of the
 * view, as the zoom keys do.
 */

import { ZOOM_STEP } from "../../camera/index.js";
import { Pill, PillButton } from "../atoms/Pill.js";
import { useCameraState, useCanvas, useCanvasSize } from "../utils/canvas-context.js";

export function ZoomIndicator() {
  const { camera } = useCanvas();
  const { zoom } = useCameraState();
  const size = useCanvasSize();
  const centre = { x: size.width / 2, y: size.height / 2 };
  const percent = Math.round(zoom * 100);
  return (
    <Pill>
      <PillButton aria-label="Zoom out" onClick={() => camera.zoomAt(centre, 1 / ZOOM_STEP)}>
        &minus;
      </PillButton>
      <PillButton
        className="border-x border-line tabular-nums"
        aria-label={`Zoom ${percent} percent. Reset to 100 percent`}
        onClick={() => camera.zoomAt(centre, 1 / zoom)}
      >
        {percent}%
      </PillButton>
      <PillButton aria-label="Zoom in" onClick={() => camera.zoomAt(centre, ZOOM_STEP)}>
        +
      </PillButton>
    </Pill>
  );
}
