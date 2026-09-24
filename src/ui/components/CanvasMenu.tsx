/**
 * ─ Canvas menu ─
 *
 * The right-click menu over the canvas, for the point it was opened
 * at: a comment there always; in edit mode, a picture hung there when
 * nothing hangs there, a picture of your own taken down, and a drawn
 * room, or the rooms picked, removed. Rendered inside the canvas's
 * menu root; the point and what lies under it come in from the host.
 * Decision: DECISIONS.md, adding a comment: a button and a menu, not a bare tap.
 */

import { ContextMenu } from "radix-ui";
import type { Point } from "../../geometry.js";
import type { HungRoom, HungWork } from "../../gallery/layout/hang.js";
import { mayHandle } from "../../gallery/works.js";
import { useOwnStore } from "../../state/own-store.js";
import { useStore } from "../../state/store.js";
import { usePlan } from "../../state/utils/plan.js";

const MENU = "z-20 min-w-40 rounded-md border border-line bg-surface p-1 shadow-lg";
const ITEM =
  "cursor-default rounded px-2 py-1.5 font-sans text-sm text-ink outline-none " +
  "data-[highlighted]:bg-accent data-[highlighted]:text-accent-ink";

/** The items for a right click at `at`, over `room` and `work` if any. */
export function CanvasMenu({
  at,
  room,
  work,
}: {
  /** Where the menu was opened, in world units, read when an item is chosen. */
  readonly at: () => Point;
  readonly room: HungRoom | undefined;
  readonly work: HungWork | undefined;
}) {
  const mode = useStore((store) => store.mode);
  const startDraft = useStore((store) => store.startDraft);
  const removeRoom = useStore((store) => store.removeRoom);
  const selected = useStore((store) => store.selected);
  const removeSelected = useStore((store) => store.removeSelected);
  const askPicture = useStore((store) => store.askPicture);
  const takeDown = useStore((store) => store.takeDown);
  const userId = useOwnStore((store) => store.userId);
  const plan = usePlan();
  // Of the rooms picked, the drawn ones, which are the ones a removal takes.
  const picked = plan.rooms.filter(
    (hung) => hung.room.drawn === true && selected.includes(hung.room.id)
  ).length;
  const isEditing = mode === "edit";
  return (
    <ContextMenu.Portal>
      <ContextMenu.Content className={MENU}>
        <ContextMenu.Item className={ITEM} onSelect={() => startDraft(at())}>
          Add comment here
        </ContextMenu.Item>
        {isEditing && work === undefined && (
          <ContextMenu.Item className={ITEM} onSelect={() => askPicture(at())}>
            Hang a picture here
          </ContextMenu.Item>
        )}
        {isEditing && work?.work.pictureId !== undefined && mayHandle(work.work, userId) && (
          <ContextMenu.Item className={ITEM} onSelect={() => takeDown(work.work.id)}>
            Take down
          </ContextMenu.Item>
        )}
        {isEditing && picked > 0 && (
          <ContextMenu.Item className={ITEM} onSelect={() => removeSelected()}>
            {picked === 1 ? "Remove the selected room" : `Remove the ${picked} selected rooms`}
          </ContextMenu.Item>
        )}
        {isEditing && picked === 0 && room?.room.drawn === true && (
          <ContextMenu.Item className={ITEM} onSelect={() => removeRoom(room.room.id)}>
            Remove this room
          </ContextMenu.Item>
        )}
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
}
