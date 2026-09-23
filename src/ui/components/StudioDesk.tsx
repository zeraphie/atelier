/**
 * ─ Studio desk ─
 *
 * The settings, as a desk in the Studio rather than a panel over the
 * canvas: a DOM panel anchored to a point in the world, moved and
 * scaled by the same camera as everything else, so from the plan it is
 * a desk and up close it is a form. What sits on it is what the arrival
 * card asked for, so it stays yours to change after coming in: the
 * viewing's code, the name, the colour; and the grid.
 * Decision: DECISIONS.md, rooms as grouping on the canvas.
 */

import { useState } from "react";
import { useOwnStore } from "../../state/own-store.js";
import { useStore } from "../../state/store.js";
import { usePlan } from "../../state/utils/plan.js";
import { newViewingCode } from "../../viewing/code.js";
import { swatchIdFor } from "../../viewing/color.js";
import { OnFloor } from "../molecules/OnFloor.js";
import { IdentityFields } from "../molecules/IdentityFields.js";
import { useCameraState, useCanvas, useGridShown } from "../utils/canvas-context.js";
import { enterViewing } from "../utils/use-viewing.js";

// The desk's width in centimetres, and the width its contents are laid out at: the arrival
// card's, so the desk is that card scaled into the Studio, and as tall as what sits on it.
const WIDTH_CM = 160;
const LAYOUT_PX = 384;

export function StudioDesk() {
  const camera = useCameraState();
  const viewingCode = useStore((store) => store.viewingCode);
  const name = useOwnStore((store) => store.name);
  const studio = usePlan().rooms.find((room) => room.room.id === "studio");
  if (studio === undefined) {
    return null;
  }
  const { rect } = studio;
  const left = (rect.left + rect.right - WIDTH_CM) / 2;
  // A third of the way down the room, clear of its name.
  const top = rect.top + (rect.bottom - rect.top) / 3;
  return (
    <OnFloor
      camera={camera}
      at={{ x: left, y: top }}
      widthCm={WIDTH_CM}
      layoutPx={LAYOUT_PX}
      aria-label="Studio desk"
      className="flex flex-col gap-3 p-5"
    >
      <Identity key={`${viewingCode}:${name}`} viewingCode={viewingCode} name={name} />
      <GridToggle />
    </OnFloor>
  );
}

// The code, name and colour as kept: a code or a name is kept when done with,
// a colour as soon as it is picked; a new code joins that viewing. Keyed by
// the kept code and name, so a change from elsewhere starts the drafts afresh.
function Identity({
  viewingCode,
  name,
}: {
  readonly viewingCode: string | undefined;
  readonly name: string;
}) {
  const color = useOwnStore((store) => store.color);
  const setName = useOwnStore((store) => store.setName);
  const setColor = useOwnStore((store) => store.setColor);
  const [codeDraft, setCodeDraft] = useState(viewingCode ?? "");
  const [nameDraft, setNameDraft] = useState(name);
  return (
    <IdentityFields
      idPrefix="desk"
      code={codeDraft}
      name={nameDraft}
      color={swatchIdFor(name, color)}
      onCode={setCodeDraft}
      onNewCode={() => {
        const code = newViewingCode();
        setCodeDraft(code);
        enterViewing(code);
      }}
      onName={setNameDraft}
      onColor={setColor}
      onCodeDone={() => {
        const code = codeDraft.trim().toLowerCase();
        if (code !== "" && code !== viewingCode) {
          enterViewing(code);
        }
      }}
      onNameDone={() => setName(nameDraft)}
    />
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
