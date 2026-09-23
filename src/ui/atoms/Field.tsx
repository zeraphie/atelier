/**
 * ─ Field ─
 *
 * Where a person types: a textarea for a comment, in the reading face
 * so it reads as the comment it will be, and an input for a short
 * answer such as a name. A class passed in joins the atom's own.
 */

import type { ComponentProps } from "react";
import { FOCUS_RING as FOCUS } from "./styles.js";
const TEXTAREA =
  "w-full resize-none rounded-md border border-line bg-surface px-3 py-2 font-serif text-base " +
  `leading-snug text-ink placeholder:text-muted ${FOCUS}`;
const INPUT = `w-full rounded border border-line bg-canvas px-2 py-1 font-sans text-xs text-ink ${FOCUS}`;

/** A field's frame: its caption above its control, in the caption face; for a frame that is not a label. */
export const FIELD = "flex flex-col gap-1 font-sans text-xs text-muted";

/** A field's frame as a label with its control inside, so a press on the caption reaches the control. */
export function FieldLabel({ className = "", ...props }: ComponentProps<"label">) {
  return <label className={`${FIELD} ${className}`} {...props} />;
}

/** Where a comment is typed, in the reading face. */
export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${TEXTAREA} ${className}`} {...props} />;
}

/** Where a short answer is typed, such as a name or a code. */
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${INPUT} ${className}`} {...props} />;
}
