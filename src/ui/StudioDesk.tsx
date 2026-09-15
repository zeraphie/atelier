/**
 * ─ Studio desk ─
 *
 * The settings, as a desk in the Studio rather than a panel over the
 * canvas: a DOM panel anchored to a rectangle in the world, moved and
 * scaled by the same camera as everything else, so from the plan it is
 * a desk and up close it is a form. What sits on it is what nobody
 * needs at hand all the time: the name to comment under, the grid.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { useState } from "react";
import { worldToScreen } from "../camera/index.js";
import { useCommentsStore } from "../comments/store.js";
import { PLAN } from "../gallery/plan.js";
import { useCameraState, useCanvas, useGridShown } from "./canvas-context.js";

// The desk's size in centimetres, which is its size on screen at 100%.
const WIDTH_CM = 180;
const HEIGHT_CM = 120;

const FIELD =
  "w-full rounded-md border border-line bg-canvas px-2 py-1 font-sans text-sm text-ink " +
  "focus-visible:outline-2 focus-visible:outline-accent";

export function StudioDesk() {
  const camera = useCameraState();
  const studio = PLAN.rooms.find((room) => room.room.id === "studio");
  if (studio === undefined) {
    return null;
  }
  const { rect } = studio;
  const left = (rect.left + rect.right - WIDTH_CM) / 2;
  const top = (rect.top + rect.bottom - HEIGHT_CM) / 2;
  const at = worldToScreen(camera, { x: left, y: top });
  return (
    <section
      aria-label="Studio desk"
      className="absolute top-0 left-0 origin-top-left rounded-lg border border-line bg-surface p-4 shadow-md"
      style={{
        width: WIDTH_CM,
        height: HEIGHT_CM,
        transform: `translate(${at.x}px, ${at.y}px) scale(${camera.zoom})`,
      }}
    >
      <h2 className="mb-3 font-display text-sm text-ink">Studio</h2>
      <NameField />
      <GridToggle />
    </section>
  );
}

function NameField() {
  const author = useCommentsStore((store) => store.author);
  const setAuthor = useCommentsStore((store) => store.setAuthor);
  const [draft, setDraft] = useState(author);
  return (
    <label className="mb-3 block">
      <span className="mb-1 block font-sans text-xs text-muted">Comment as</span>
      <input
        className={FIELD}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => setAuthor(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
    </label>
  );
}

function GridToggle() {
  const { gridShown } = useCanvas();
  const isShown = useGridShown();
  return (
    <label className="flex items-center gap-2 font-sans text-sm text-ink">
      <input
        type="checkbox"
        className="size-4 accent-accent"
        checked={isShown}
        onChange={(event) => gridShown.set(event.target.checked)}
      />
      Show the grid
    </label>
  );
}
