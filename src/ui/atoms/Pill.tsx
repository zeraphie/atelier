/**
 * ─ Pill ─
 *
 * A corner's worth of controls in one rounded surface, the tools that
 * sit in it, and a reading between them. A tool shows its pressed and
 * expanded states in colour, and `divided` draws its left edge against
 * the tool before it.
 */

import type { ComponentProps } from "react";
import { TOOL } from "./styles.js";

const PILL = "flex overflow-hidden rounded-md border border-line bg-surface shadow-sm";
const PILL_TOOL =
  `${TOOL} h-8 min-w-8 gap-2 px-2 font-sans text-sm ` +
  "active:bg-line disabled:text-muted disabled:hover:bg-transparent aria-expanded:bg-canvas";
const LABEL = "flex h-8 items-center border-x border-line px-3 font-sans text-sm text-muted";

/** A corner's worth of controls in one rounded surface. */
export function Pill({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`${PILL} ${className}`} {...props} />;
}

/** A tool in a pill, showing pressed and expanded in colour. */
export function PillButton({
  divided = false,
  className = "",
  ...props
}: ComponentProps<"button"> & { readonly divided?: boolean }) {
  const edge = divided ? "border-l border-line" : "";
  return <button type="button" className={`${PILL_TOOL} ${edge} ${className}`} {...props} />;
}

/** A reading between tools: where the tour stands. */
export function PillLabel({ className = "", ...props }: ComponentProps<"span">) {
  return <span className={`${LABEL} ${className}`} {...props} />;
}
