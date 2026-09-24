/**
 * ─ Use follow ─
 *
 * Where you look, said to the viewing as the camera moves, and following: a
 * peer chosen in the chip has their latest look put on your camera as
 * it comes, centred where theirs is at their zoom whatever your
 * window's size, and they are told so. The moment anything else moves
 * your camera, a drag, a wheel, the tour, a jump, the camera is yours
 * again and they are told that too; the follow's own moves are flagged
 * so they do not count as yours.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { useEffect } from "react";
import { centredOn } from "../../camera/index.js";
import { useStore } from "../../state/store.js";
import { sayFollowing, sayLook } from "../../viewing/presence/presence.js";
import { lookOf, looks, type Look } from "../../viewing/presence/looks.js";
import { useCanvas } from "./canvas-context.js";

/** Where you look, said as the camera or the canvas changes. */
export function useLookSharing(): void {
  const { camera, canvasSize } = useCanvas();
  useEffect(() => {
    const say = (): void => sayLook(lookOf(camera.current, canvasSize.current));
    say();
    const stopCamera = camera.onChange(say);
    const stopSize = canvasSize.subscribe(say);
    return () => {
      stopCamera();
      stopSize();
    };
  }, [camera, canvasSize]);
}

/** The peer followed, if any, steering the camera until anything else does. */
export function useFollowing(): void {
  const following = useStore((store) => store.following);
  const unfollow = useStore((store) => store.unfollow);
  const { camera, canvasSize } = useCanvas();
  useEffect(() => {
    if (following === undefined) {
      return;
    }
    let isApplying = false;
    const apply = (theirs: Look | undefined): void => {
      if (theirs === undefined) {
        return;
      }
      isApplying = true;
      camera.set(centredOn(theirs.centre, theirs.zoom, canvasSize.current));
      isApplying = false;
    };
    sayFollowing(following, true);
    apply(looks.current[following]);
    const stopViews = looks.subscribe((all) => apply(all[following]));
    const stopSize = canvasSize.subscribe(() => apply(looks.current[following]));
    const stopCamera = camera.onChange(() => {
      if (!isApplying) {
        unfollow();
      }
    });
    return () => {
      stopViews();
      stopSize();
      stopCamera();
      sayFollowing(following, false);
    };
  }, [following, camera, canvasSize, unfollow]);
}
