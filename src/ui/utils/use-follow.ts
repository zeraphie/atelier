/**
 * ─ Use follow ─
 *
 * Your view said to the viewing as the camera moves, and following: a
 * peer chosen in the chip has their latest view put on your camera as
 * it comes, centred where theirs is at their zoom whatever your
 * window's size, and they are told so. The moment anything else moves
 * your camera, a drag, a wheel, the tour, a jump, the view is yours
 * again and they are told that too; the follow's own moves are flagged
 * so they do not count as yours.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { useEffect } from "react";
import { centredOn } from "../../camera/index.js";
import { useStore } from "../../state/store.js";
import { sayFollowing, sayView } from "../../viewing/viewing.js";
import { viewOf, views, type View } from "../../viewing/views.js";
import { useCanvas } from "./canvas-context.js";

/** Your view, said as the camera or the window changes. */
export function useViewSharing(): void {
  const { camera, view } = useCanvas();
  useEffect(() => {
    const say = (): void => sayView(viewOf(camera.current, view.current));
    say();
    const stopCamera = camera.onChange(say);
    const stopSize = view.subscribe(say);
    return () => {
      stopCamera();
      stopSize();
    };
  }, [camera, view]);
}

/** The peer followed, if any, steering the camera until anything else does. */
export function useFollowing(): void {
  const following = useStore((store) => store.following);
  const unfollow = useStore((store) => store.unfollow);
  const { camera, view } = useCanvas();
  useEffect(() => {
    if (following === undefined) {
      return;
    }
    let isApplying = false;
    const apply = (theirs: View | undefined): void => {
      if (theirs === undefined) {
        return;
      }
      isApplying = true;
      camera.set(centredOn(theirs.centre, theirs.zoom, view.current));
      isApplying = false;
    };
    sayFollowing(following, true);
    apply(views.current[following]);
    const stopViews = views.subscribe((all) => apply(all[following]));
    const stopSize = view.subscribe(() => apply(views.current[following]));
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
  }, [following, camera, view, unfollow]);
}
