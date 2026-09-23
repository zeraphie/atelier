/**
 * ─ Card ─
 *
 * The raised surface the panels share: a popover, the list, the
 * plaque, the desk. The class is exported as well, for a Radix content
 * element, which takes a class rather than a child; and with it the
 * shell of a dialog, its overlay, its panel and its title, which the
 * picture form, the reset and the arrival card share.
 */

import type { ComponentProps } from "react";

export const CARD = "rounded-md border border-line bg-surface shadow-md";

/** What a dialog lays over everything behind it. */
export const DIALOG_OVERLAY = "fixed inset-0 z-30 bg-ink/35";

/** A dialog's panel: a card of one width, fixed and centred across; where it sits down the window, and how high it stacks, are the dialog's own. */
export const DIALOG_PANEL = `${CARD} fixed left-1/2 flex w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-3 p-5`;

/** A dialog's panel in the middle of the window, above its overlay. */
export const DIALOG_CONTENT = `${DIALOG_PANEL} top-1/2 z-40 -translate-y-1/2`;

/** A dialog's title line. */
export const DIALOG_TITLE = "font-sans text-base font-bold text-ink";

/** The raised surface every panel and popover sits on. */
export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`${CARD} ${className}`} {...props} />;
}
