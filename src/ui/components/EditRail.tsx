/**
 * ─ Edit rail ─
 *
 * The tools of edit mode, in a column at the left while the mode is
 * on: Move, which is the rest; Room, Door and Picture, which are pens
 * to pick up; and, under a line, Put everything back, which puts its
 * question up: the dialog is PutEverythingBack.tsx, on every screen.
 * Picking a tool holds it; Move or Escape puts it down. A floating
 * column with the held tool in the accent and a tip beside each, the
 * idea borrowed from tablewright's rail.
 * Decision: DECISIONS.md, the edit rail holds the tools.
 */

import { Toolbar, Tooltip } from "radix-ui";
import type { ReactNode } from "react";
import type { Tool } from "../../state/slices/interface.js";
import { useStore } from "../../state/store.js";
import { Card } from "../atoms/Card.js";
import { DoorIcon, MoveIcon, PictureIcon, ResetIcon, RoomIcon } from "../atoms/icons.js";
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
  const askReset = useStore((store) => store.askReset);
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
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Toolbar.Button
              aria-label="Put everything back"
              className={`${RAIL_TOOL} text-muted`}
              onClick={() => askReset(true)}
            >
              <ResetIcon />
            </Toolbar.Button>
          </Tooltip.Trigger>
          <Tip side="right">Put everything back</Tip>
        </Tooltip.Root>
      </Toolbar.Root>
    </Card>
  );
}
