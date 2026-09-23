/**
 * ─ Tip ─
 *
 * The tooltip's bubble, in ink beside whatever it describes, above by
 * default. The root and the trigger stay with that thing, since they
 * wrap it.
 */

import { Tooltip } from "radix-ui";
import type { ReactNode } from "react";

const TIP = "z-20 rounded-md bg-ink px-2 py-1 font-sans text-xs text-surface shadow-md";

export function Tip({
  side = "top",
  children,
}: {
  readonly side?: "top" | "right" | "bottom" | "left";
  readonly children: ReactNode;
}) {
  return (
    <Tooltip.Portal>
      <Tooltip.Content className={TIP} side={side} sideOffset={8}>
        {children}
      </Tooltip.Content>
    </Tooltip.Portal>
  );
}
