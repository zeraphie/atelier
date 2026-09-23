/**
 * ─ Room name ─
 *
 * The field a room's name is typed in, over the name itself on the
 * floor, at the same size on screen as the name, placed by the camera
 * like a pin. Enter keeps what was typed, Escape keeps what was there,
 * and leaving the field keeps what was typed too, since a click
 * elsewhere is not a change of mind.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import { useEffect, useRef, useState } from "react";
import { worldToScreen } from "../../camera/index.js";
import { usePlan } from "../../state/plan.js";
import { useStore } from "../../state/store.js";
import { useCameraState } from "../utils/canvas-context.js";

// The name's inset from the room's corner, as the room view draws it.
const NAME_INSET_CM = 16;

export function RoomName() {
  const renaming = useStore((store) => store.renaming);
  const plan = usePlan();
  const room = plan.rooms.find((hung) => hung.room.id === renaming);
  if (room === undefined) {
    return null;
  }
  return <NameField key={room.room.id} id={room.room.id} name={room.room.name} at={room.rect} />;
}

function NameField({
  id,
  name,
  at,
}: {
  readonly id: string;
  readonly name: string;
  readonly at: { readonly left: number; readonly top: number };
}) {
  const camera = useCameraState();
  const renameRoom = useStore((store) => store.renameRoom);
  const stopRename = useStore((store) => store.stopRename);
  const [text, setText] = useState(name);
  const field = useRef<HTMLInputElement>(null);
  const screen = worldToScreen(camera, { x: at.left + NAME_INSET_CM, y: at.top + NAME_INSET_CM });
  // The field opens to be typed in, with the name selected, so typing replaces it.
  useEffect(() => {
    field.current?.focus();
    field.current?.select();
  }, []);
  const keep = (): void => {
    const typed = text.trim();
    if (typed !== "" && typed !== name) {
      renameRoom(id, typed);
    }
    stopRename();
  };
  return (
    <input
      ref={field}
      aria-label="Room name"
      className="absolute top-0 left-0 -translate-y-[3px] rounded border border-accent bg-surface px-1 font-display text-[13px] leading-none font-bold text-ink outline-none"
      style={{ transform: `translate(${screen.x - 5}px, ${screen.y - 3}px)`, width: "12ch" }}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={keep}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          keep();
        } else if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          stopRename();
        }
      }}
    />
  );
}
