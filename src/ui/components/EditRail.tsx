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
import type { Tool } from "../../state/slices/interface.js";
import { useStore } from "../../state/store.js";
import { Card, DIALOG_CONTENT, DIALOG_OVERLAY, DIALOG_TITLE } from "../atoms/Card.js";
import { DoorIcon, MoveIcon, PictureIcon, ResetIcon, RoomIcon } from "../atoms/icons.js";
import { TextButton } from "../atoms/TextButton.js";
import { Tip } from "../atoms/Tip.js";
import { TOOL } from "../atoms/styles.js";

// The held tool by aria-checked, not data-state: the tooltip trigger shares the
// element and writes its own data-state over the toggle's.
const RAIL_TOOL = `${TOOL} size-9 rounded`;

const TOOLS: readonly { readonly tool: Tool; readonly label: string; readonly icon: ReactNode }[] =
  [
    { tool: "move", label: "Move: drag a picture, a wall or a doorway", icon: <MoveIcon /> },
    { tool: "room", label: "Room: drag on the ground to draw one", icon: <RoomIcon /> },
    { tool: "door", label: "Door: click a wall to put the doorway there", icon: <DoorIcon /> },
    {
      tool: "picture",
      label: "Picture: click a floor to hang one of your own; drag a corner to size it",
      icon: <PictureIcon />,
    },
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
                <Toolbar.ToggleItem value={which} aria-label={label} className={RAIL_TOOL}>
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
            <Toolbar.Button aria-label="Put everything back" className={`${RAIL_TOOL} text-muted`}>
              <ResetIcon />
            </Toolbar.Button>
          </AlertDialog.Trigger>
        </Tooltip.Trigger>
        <Tip side="right">Put everything back</Tip>
      </Tooltip.Root>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={DIALOG_OVERLAY} />
        <AlertDialog.Content className={DIALOG_CONTENT}>
          <AlertDialog.Title className={DIALOG_TITLE}>Put everything back?</AlertDialog.Title>
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
