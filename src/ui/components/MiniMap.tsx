/**
 * ─ Mini-map ─
 *
 * The whole plan at a glance, as an SVG drawn from the same data the
 * canvas hangs: the rooms, the walls with their doorways cut, each
 * work in its own colour, the pins, and the view as a frame over it
 * all. A press on the map takes the view there at its zoom, and a
 * drag carries it, so the map is the way across the gallery that
 * needs no zoom out and in.
 * Decision: DECISIONS.md, finding a comment: the list, the map and the jump.
 */

import type { PointerEvent } from "react";
import { centredOn, moveTo, visibleRect, type Point } from "../../camera/index.js";
import { useCommentsStore } from "../../comments/store.js";
import { SPACING } from "../../gallery/hang.js";
import images from "../../gallery/images.json";
import { PLAN } from "../../gallery/plan.js";
import type { ImageEntry } from "../../gallery/tiers.js";
import { useCameraState, useCanvas, useViewSize } from "../utils/canvas-context.js";

// Ground kept clear around the plan, in centimetres, so the outer walls stand off the frame.
const MARGIN_CM = 60;
// A pin on the map, in centimetres: a few pixels at the map's scale.
const PIN_CM = 18;

const IMAGES: Readonly<Record<string, ImageEntry>> = images;
const BOX = {
  x: PLAN.bounds.left - MARGIN_CM,
  y: PLAN.bounds.top - MARGIN_CM,
  width: PLAN.bounds.right - PLAN.bounds.left + 2 * MARGIN_CM,
  height: PLAN.bounds.bottom - PLAN.bounds.top + 2 * MARGIN_CM,
};
const WORKS = PLAN.rooms.flatMap((room) => room.works);

// A pointer's place as a world point, through the map's own transform, whatever its size.
function worldAt(event: PointerEvent<SVGSVGElement>): Point | undefined {
  const matrix = event.currentTarget.getScreenCTM();
  if (matrix === null) {
    return undefined;
  }
  const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
  return { x: point.x, y: point.y };
}

export function MiniMap() {
  const { camera, view } = useCanvas();
  const state = useCameraState();
  const size = useViewSize();
  const threads = useCommentsStore((store) => store.threads);
  const shown = visibleRect(state, size);

  // A press glides the view there; a drag carries it along, with no glide to lag behind.
  const goTo = (event: PointerEvent<SVGSVGElement>, isPress: boolean): void => {
    const world = worldAt(event);
    if (world === undefined) {
      return;
    }
    const there = centredOn(world, camera.current.zoom, view.current);
    if (isPress) {
      moveTo(camera, there, view.current);
    } else {
      camera.set(there);
    }
  };

  return (
    <svg
      viewBox={`${BOX.x} ${BOX.y} ${BOX.width} ${BOX.height}`}
      className="w-48 cursor-pointer touch-none rounded-md border border-line bg-canvas shadow-sm"
      aria-label="Plan of the gallery, with the view over it"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        goTo(event, true);
      }}
      onPointerMove={(event) => {
        if (event.buttons !== 0) {
          goTo(event, false);
        }
      }}
    >
      {PLAN.rooms.map(({ room, rect }) => (
        <rect
          key={room.id}
          className="fill-surface"
          x={rect.left}
          y={rect.top}
          width={rect.right - rect.left}
          height={rect.bottom - rect.top}
        />
      ))}
      {PLAN.walls.map((wall) => (
        <line
          key={`${wall.a.x},${wall.a.y}-${wall.b.x},${wall.b.y}`}
          className="stroke-ink"
          x1={wall.a.x}
          y1={wall.a.y}
          x2={wall.b.x}
          y2={wall.b.y}
          strokeWidth={SPACING.wallCm}
          strokeLinecap="square"
        />
      ))}
      {WORKS.map(({ work, rect }) => (
        <rect
          key={work.id}
          fill={IMAGES[work.id]?.color}
          x={rect.left}
          y={rect.top}
          width={rect.right - rect.left}
          height={rect.bottom - rect.top}
        />
      ))}
      {threads.map((thread) => (
        <circle
          key={thread.id}
          className="fill-accent data-[resolved=true]:fill-resolved"
          data-resolved={thread.resolved}
          cx={thread.at.x}
          cy={thread.at.y}
          r={PIN_CM}
        />
      ))}
      <rect
        className="fill-accent/10 stroke-accent"
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        x={shown.left}
        y={shown.top}
        width={shown.right - shown.left}
        height={shown.bottom - shown.top}
      />
    </svg>
  );
}
