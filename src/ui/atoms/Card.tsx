/**
 * ─ Card ─
 *
 * The raised surface the panels share: a popover, the list, the
 * plaque, the desk. The class is exported as well, for a Radix content
 * element, which takes a class rather than a child.
 */

import type { ComponentProps } from "react";

export const CARD = "rounded-md border border-line bg-surface shadow-md";

/** The raised surface every panel and popover sits on. */
export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`${CARD} ${className}`} {...props} />;
}
