import { Canvas } from "./ui/Canvas.js";
import { CanvasProvider } from "./ui/canvas-context.js";
import { TourControls } from "./ui/TourControls.js";
import { ZoomIndicator } from "./ui/ZoomIndicator.js";

export function App() {
  return (
    <CanvasProvider>
      <main className="relative h-dvh overflow-hidden bg-canvas text-ink">
        <Canvas />
        <TourControls />
        <ZoomIndicator />
      </main>
    </CanvasProvider>
  );
}
