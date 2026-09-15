/**
 * ─ Canvas ─
 *
 * The host element the stage draws into, and the effect that mounts
 * it. The canvas chunk is loaded here, on demand, and mounting is
 * async after that, so the cleanup marks the effect disposed and a
 * canvas that finishes after that is torn down at once: StrictMode's
 * double mount is a real test of the teardown, not a special case.
 */

import { useEffect, useRef } from "react";
import { useCanvas } from "./canvas-context.js";
import { failLoader, raiseCurtain } from "./curtain.js";

export function Canvas() {
  const { camera, view } = useCanvas();
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (host === null) {
      return;
    }
    let isDisposed = false;
    let teardown = (): void => {};
    const mount = async (): Promise<void> => {
      const { mountCanvas } = await import("../canvas/mount.js");
      const mounted = await mountCanvas(host, camera, view);
      if (isDisposed) {
        mounted.dispose();
        return;
      }
      teardown = mounted.dispose;
      void mounted.firstFrame.then(raiseCurtain);
    };
    mount().catch((error: unknown) => {
      failLoader();
      reportError(error);
    });
    return () => {
      isDisposed = true;
      teardown();
    };
  }, [camera, view]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 cursor-grab touch-none select-none data-[camera=panning]:cursor-grabbing"
    />
  );
}
