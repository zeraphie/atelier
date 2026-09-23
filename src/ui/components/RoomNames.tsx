/**
 * ─ Room names ─
 *
 * Each room's name at its corner, in the DOM, placed by the camera at
 * one size on screen like a pin, so it is crisp at every zoom and, in
 * edit mode, edited in place: a click puts the caret in it, Enter or a
 * click elsewhere keeps what was typed, Escape keeps what was there.
 * A room just drawn has its name asked for the same way: the name
 * takes the caret with its placeholder selected, so typing replaces
 * it. Out of edit mode the names take no pointer, so the floor under
 * them still pans. The editable name is keyed by its text: the
 * browser rewrites the node as you type, so a name changed elsewhere,
 * by a peer or by putting everything back, mounts afresh rather than
 * trusting React to find the node again.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import { useEffect, useRef, type FocusEvent, type KeyboardEvent } from "react";
import { worldToScreen, type Point } from "../../camera/index.js";
import type { HungRoom } from "../../gallery/hang.js";
import { usePlan } from "../../state/utils/plan.js";
import { useStore } from "../../state/store.js";
import { useCameraState } from "../utils/canvas-context.js";

// The name's inset from the room's corner, in centimetres.
const NAME_INSET_CM = 16;

const NAME =
  "absolute top-0 left-0 whitespace-nowrap font-display text-[13px] leading-none font-bold text-muted";
// A minimum box keeps the caret in view while the name is blank.
const EDITABLE =
  `${NAME} pointer-events-auto -mx-0.5 min-h-[1em] min-w-[1ch] cursor-text rounded-sm px-0.5 ` +
  "hover:bg-canvas focus:bg-surface focus:text-ink focus:outline-2 focus:outline-accent";

export function RoomNames() {
  const plan = usePlan();
  const mode = useStore((store) => store.mode);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {plan.rooms.map((room) => (
        <RoomName key={room.room.id} room={room} isEditable={mode === "edit"} />
      ))}
    </div>
  );
}

function RoomName({ room, isEditable }: { readonly room: HungRoom; readonly isEditable: boolean }) {
  const camera = useCameraState();
  const renameRoom = useStore((store) => store.renameRoom);
  const naming = useStore((store) => store.naming);
  const askName = useStore((store) => store.askName);
  const field = useRef<HTMLDivElement>(null);
  const { id, name } = room.room;
  // Asked for its name: the caret goes in with the whole placeholder selected, once.
  useEffect(() => {
    const element = field.current;
    if (naming !== id || element === null) {
      return;
    }
    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    askName(undefined);
  }, [naming, id, askName]);
  const at = worldToScreen(camera, {
    x: room.rect.left + NAME_INSET_CM,
    y: room.rect.top + NAME_INSET_CM,
  });
  if (!isEditable) {
    return (
      <div className={NAME} style={placedAt(at)}>
        {name}
      </div>
    );
  }
  const keep = (event: FocusEvent<HTMLDivElement>): void => {
    const typed = event.currentTarget.textContent.trim();
    if (typed !== "" && typed !== name) {
      renameRoom(id, typed);
    } else {
      event.currentTarget.textContent = name;
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.textContent = name;
      event.currentTarget.blur();
    }
  };
  return (
    <div
      key={name}
      ref={field}
      className={EDITABLE}
      style={placedAt(at)}
      // Textbox is the role for a contenteditable element; the rule only
      // knows inputs, which cannot be the name itself.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="textbox"
      aria-label={`Name of the room ${name}`}
      tabIndex={0}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={keep}
      onKeyDown={onKeyDown}
    >
      {name}
    </div>
  );
}

function placedAt(at: Point): { readonly transform: string } {
  return { transform: `translate(${at.x}px, ${at.y}px)` };
}
