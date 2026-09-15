/**
 * ─ Canvas session ─
 *
 * One camera and one view size for the whole app, made once and
 * handed down by context. The camera is a plain class with its own
 * listeners, so React subscribes to it rather than copying its state;
 * the stage follows the same camera, and so will the pins in the DOM.
 * Nothing here imports a renderer, so the app chunk stays free of one.
 * Decision: DECISIONS.md, one camera for canvas and DOM.
 */

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { Camera, type CameraState, type ViewSize } from "../camera/index.js";
import type { TourHandle } from "../canvas/tour.js";
import { ValueStore } from "../canvas/value-store.js";

export interface CanvasSession {
  readonly camera: Camera;
  /** The canvas size in CSS pixels, kept current by the canvas host. */
  readonly view: ValueStore<ViewSize>;
  /** The tour along the route, once the canvas has mounted. */
  readonly tour: ValueStore<TourHandle | undefined>;
  /** Whether the dot grid is drawn. */
  readonly gridShown: ValueStore<boolean>;
}

const CanvasContext = createContext<CanvasSession | undefined>(undefined);

export function CanvasProvider({ children }: { readonly children: ReactNode }) {
  const [session] = useState<CanvasSession>(() => ({
    camera: new Camera(),
    view: new ValueStore({ width: 0, height: 0 }),
    tour: new ValueStore<TourHandle | undefined>(undefined),
    gridShown: new ValueStore(true),
  }));
  return <CanvasContext value={session}>{children}</CanvasContext>;
}

/** The session, for components under a CanvasProvider. */
export function useCanvas(): CanvasSession {
  const session = useContext(CanvasContext);
  if (session === undefined) {
    throw new Error("useCanvas needs a CanvasProvider above it");
  }
  return session;
}

/** The camera's state, re-rendering on every change. */
export function useCameraState(): CameraState {
  const { camera } = useCanvas();
  return useSyncExternalStore(
    (listener) => camera.onChange(listener),
    () => camera.current
  );
}

/** The tour, once there is one, re-rendering when it comes or goes. */
export function useTour(): TourHandle | undefined {
  const { tour } = useCanvas();
  return useSyncExternalStore(
    (listener) => tour.subscribe(listener),
    () => tour.current
  );
}

/** Whether the grid is drawn, re-rendering when it is switched. */
export function useGridShown(): boolean {
  const { gridShown } = useCanvas();
  return useSyncExternalStore(
    (listener) => gridShown.subscribe(listener),
    () => gridShown.current
  );
}

/** The canvas size in CSS pixels, re-rendering on resize. */
export function useViewSize(): ViewSize {
  const { view } = useCanvas();
  return useSyncExternalStore(
    (listener) => view.subscribe(listener),
    () => view.current
  );
}
