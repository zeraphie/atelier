import { Tooltip } from "radix-ui";
import { Canvas } from "./ui/Canvas.js";
import { CanvasProvider } from "./ui/canvas-context.js";
import { PinLayer } from "./ui/PinLayer.js";
import { useShortcuts } from "./ui/shortcuts.js";
import { StudioDesk } from "./ui/StudioDesk.js";
import { Toolbar } from "./ui/Toolbar.js";
import { TourControls } from "./ui/TourControls.js";
import { ZoomIndicator } from "./ui/ZoomIndicator.js";

export function App() {
  useShortcuts();
  return (
    <CanvasProvider>
      <Tooltip.Provider delayDuration={300}>
        <main className="relative h-dvh overflow-hidden bg-canvas text-ink">
          <Canvas />
          <StudioDesk />
          <PinLayer />
          <Toolbar />
          <TourControls />
          <ZoomIndicator />
        </main>
      </Tooltip.Provider>
    </CanvasProvider>
  );
}
