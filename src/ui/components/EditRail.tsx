/**
 * ─ Edit rail ─
 *
 * The tools of edit mode, in a column at the left while the mode is
 * on: Move, which is the rest; Room, Door and Picture, which are pens
 * to pick up; and, under a line, Put everything back, behind a dialog
 * that asks first. Picking a tool holds it; Move or Escape puts it
 * down. A floating column with the held tool in the accent and a tip
 * beside each, the idea borrowed from tablewright's rail.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import { AlertDialog, Toolbar, Tooltip } from "radix-ui";
import type { ReactNode } from "react";
import type { Tool } from "../../gallery/gallery-slice.js";
import { useStore } from "../../state/store.js";
import { Card, CARD } from "../atoms/Card.js";
import { DoorIcon, MoveIcon, PictureIcon, ResetIcon, RoomIcon } from "../atoms/icons.js";
import { TextButton } from "../atoms/TextButton.js";
import { Tip } from "../atoms/Tip.js";

// The held tool by aria-checked, not data-state: the tooltip trigger shares the
// element and writes its own data-state over the toggle's.
const TOOL =
  "flex size-9 items-center justify-center rounded text-ink hover:bg-canvas " +
  "aria-checked:bg-accent aria-checked:text-accent-ink aria-checked:hover:bg-accent " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";

const TOOLS: readonly { readonly tool: Tool; readonly label: string; readonly icon: ReactNode }[] =
  [
    { tool: "move", label: "Move: drag a picture, a wall or a doorway", icon: <MoveIcon /> },
    { tool: "room", label: "Room: drag on the ground to draw one", icon: <RoomIcon /> },
    { tool: "door", label: "Door: click a wall to put the doorway there", icon: <DoorIcon /> },
    { tool: "picture", label: "Picture: hang one of your own", icon: <PictureIcon /> },
  ];

export function EditRail() {
  const mode = useStore((store) => store.mode);
  const tool = useStore((store) => store.tool);
  const holdTool = useStore((store) => store.holdTool);
  if (mode !== "edit") {
    return null;
  }
  return (
    <Card className="absolute top-4 left-4 p-1">
      <Toolbar.Root orientation="vertical" aria-label="Edit tools" className="flex flex-col gap-1">
        <Toolbar.ToggleGroup
          type="single"
          value={tool}
          // A tool is always held; letting go of one is holding Move.
          onValueChange={(value) => holdTool(value === "" ? "move" : (value as Tool))}
          className="flex flex-col gap-1"
        >
          {TOOLS.map(({ tool: which, label, icon }) => (
            <Tooltip.Root key={which}>
              <Tooltip.Trigger asChild>
                <Toolbar.ToggleItem value={which} aria-label={label} className={TOOL}>
                  {icon}
                </Toolbar.ToggleItem>
              </Tooltip.Trigger>
              <Tip side="right">{label}</Tip>
            </Tooltip.Root>
          ))}
        </Toolbar.ToggleGroup>
        <Toolbar.Separator className="mx-1 h-px bg-line" />
        <PutEverythingBack />
      </Toolbar.Root>
    </Card>
  );
}

// The reset, behind a question: it clears every edit, for everyone in a room.
function PutEverythingBack() {
  const reset = useStore((store) => store.reset);
  return (
    <AlertDialog.Root>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <AlertDialog.Trigger asChild>
            <Toolbar.Button aria-label="Put everything back" className={`${TOOL} text-muted`}>
              <ResetIcon />
            </Toolbar.Button>
          </AlertDialog.Trigger>
        </Tooltip.Trigger>
        <Tip side="right">Put everything back</Tip>
      </Tooltip.Root>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-30 bg-ink/35" />
        <AlertDialog.Content
          className={`${CARD} fixed top-1/2 left-1/2 z-40 flex w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 p-5`}
        >
          <AlertDialog.Title className="font-sans text-base font-bold text-ink">
            Put everything back?
          </AlertDialog.Title>
          <AlertDialog.Description className="font-serif text-base leading-snug text-ink">
            Every picture returns to its wall, and every room to its size and name. This cannot be
            undone.
          </AlertDialog.Description>
          <div className="flex justify-end gap-2 pt-1">
            <AlertDialog.Cancel asChild>
              <TextButton>Cancel</TextButton>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <TextButton tone="primary" onClick={() => reset()}>
                Put back
              </TextButton>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
