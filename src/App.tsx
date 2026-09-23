import { Tooltip } from "radix-ui";
import "./state/utils/dev.js";
import { Canvas } from "./ui/components/Canvas.js";
import { CanvasProvider } from "./ui/utils/canvas-context.js";
import { CommentList } from "./ui/components/CommentList.js";
import { CursorLayer } from "./ui/components/CursorLayer.js";
import { EditRail } from "./ui/components/EditRail.js";
import { FoyerPlaque } from "./ui/components/FoyerPlaque.js";
import { MiniMap } from "./ui/components/MiniMap.js";
import { Arrival } from "./ui/components/Arrival.js";
import { PictureHanger } from "./ui/components/PictureHanger.js";
import { PinLayer } from "./ui/components/PinLayer.js";
import { RoomNames } from "./ui/components/RoomNames.js";
import { useCursorSharing, useViewing } from "./ui/utils/use-viewing.js";
import { useShortcuts } from "./ui/utils/shortcuts.js";
import { StudioDesk } from "./ui/components/StudioDesk.js";
import { ThresholdArrows } from "./ui/components/ThresholdArrows.js";
import { TourControls } from "./ui/components/TourControls.js";
import { ZoomIndicator } from "./ui/components/ZoomIndicator.js";

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
  useViewing();
  useCursorSharing();
  return (
    <main className="relative h-dvh overflow-hidden bg-canvas text-ink">
      <Canvas />
      <StudioDesk />
      <FoyerPlaque />
      <RoomNames />
      <ThresholdArrows />
      <PinLayer />
      <CursorLayer />
      <CommentList />
      <EditRail />
      <PictureHanger />
      <Arrival />
      <TourControls />
      <div className="absolute right-4 bottom-4 flex flex-col items-end gap-2">
        <MiniMap />
        <ZoomIndicator />
      </div>
    </main>
  );
}
