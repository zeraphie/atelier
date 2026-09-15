import { Tooltip } from "radix-ui";
import { Canvas } from "./ui/Canvas.js";
import { CanvasProvider } from "./ui/canvas-context.js";
import { CommentList } from "./ui/CommentList.js";
import { FoyerPlaque } from "./ui/FoyerPlaque.js";
import { MiniMap } from "./ui/MiniMap.js";
import { PinLayer } from "./ui/PinLayer.js";
import { useShortcuts } from "./ui/shortcuts.js";
import { StudioDesk } from "./ui/StudioDesk.js";
import { ThresholdArrows } from "./ui/ThresholdArrows.js";
import { TourControls } from "./ui/TourControls.js";
import { ZoomIndicator } from "./ui/ZoomIndicator.js";

export function App() {
  return (
    <CanvasProvider>
      <Tooltip.Provider delayDuration={300}>
        <Workspace />
      </Tooltip.Provider>
    </CanvasProvider>
  );
}

// The screen: the canvas, and everything laid over it, a corner each.
function Workspace() {
  useShortcuts();
  return (
    <main className="relative h-dvh overflow-hidden bg-canvas text-ink">
      <Canvas />
      <StudioDesk />
      <FoyerPlaque />
      <ThresholdArrows />
      <PinLayer />
      <CommentList />
      <TourControls />
      <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
        <MiniMap />
        <ZoomIndicator />
      </div>
    </main>
  );
}
