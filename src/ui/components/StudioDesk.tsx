/**
 * ─ Studio desk ─
 *
 * The settings, as a desk in the Studio rather than a panel over the
 * canvas: a DOM panel anchored to a point in the world, moved and
 * scaled by the same camera as everything else, so from the plan it is
 * a desk and up close it is a form. What sits on it is what nobody
 * needs at hand all the time: the name to comment under, the grid.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { useState } from "react";
import { worldToScreen } from "../../camera/index.js";
import { useCommentsStore } from "../../comments/store.js";
import { PLAN } from "../../gallery/plan.js";
import { Card } from "../atoms/Card.js";
import { Input } from "../atoms/Field.js";
import { useCameraState, useCanvas, useGridShown } from "../utils/canvas-context.js";

// The desk's width in centimetres, its width on screen at 100%; it is as tall as what sits on it.
const WIDTH_CM = 120;

export function StudioDesk() {
  const camera = useCameraState();
  const studio = PLAN.rooms.find((room) => room.room.id === "studio");
  if (studio === undefined) {
    return null;
  }
  const { rect } = studio;
  const left = (rect.left + rect.right - WIDTH_CM) / 2;
  // A third of the way down the room, clear of its name.
  const top = rect.top + (rect.bottom - rect.top) / 3;
  const at = worldToScreen(camera, { x: left, y: top });
  return (
    <Card
      aria-label="Studio desk"
      className="absolute top-0 left-0 origin-top-left p-3"
      style={{
        width: WIDTH_CM,
        transform: `translate(${at.x}px, ${at.y}px) scale(${camera.zoom})`,
      }}
    >
      <NameField />
      <GridToggle />
    </Card>
  );
}

function NameField() {
  const author = useCommentsStore((store) => store.author);
  const setAuthor = useCommentsStore((store) => store.setAuthor);
  const [draft, setDraft] = useState(author);
  return (
    <label htmlFor="comment-as" className="mb-2 block">
      <span className="mb-1 block font-sans text-xs text-muted">Comment as</span>
      <Input
        id="comment-as"
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
    <label className="flex items-center gap-2 font-sans text-xs text-ink">
      <input
        type="checkbox"
        className="size-3.5 accent-accent"
        checked={isShown}
        onChange={(event) => gridShown.set(event.target.checked)}
      />
      Show the grid
    </label>
  );
}
