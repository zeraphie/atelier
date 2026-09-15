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
import { ValueStore } from "../canvas/value-store.js";

export interface CanvasSession {
  readonly camera: Camera;
  /** The canvas size in CSS pixels, kept current by the canvas host. */
  readonly view: ValueStore<ViewSize>;
}

const CanvasContext = createContext<CanvasSession | undefined>(undefined);

export function CanvasProvider({ children }: { readonly children: ReactNode }) {
  const [session] = useState<CanvasSession>(() => ({
    camera: new Camera(),
    view: new ValueStore({ width: 0, height: 0 }),
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

/** The canvas size in CSS pixels, re-rendering on resize. */
export function useViewSize(): ViewSize {
  const { view } = useCanvas();
  return useSyncExternalStore(
    (listener) => view.subscribe(listener),
    () => view.current
  );
}
