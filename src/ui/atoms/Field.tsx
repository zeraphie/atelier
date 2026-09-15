/**
 * ─ Field ─
 *
 * Where a person types: a textarea for a comment, in the reading face
 * so it reads as the comment it will be, and an input for a short
 * answer such as a name.
 */

import type { ComponentProps } from "react";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-accent";
const TEXTAREA =
  "w-full resize-none rounded-md border border-line bg-surface px-3 py-2 font-serif text-base " +
  `leading-snug text-ink placeholder:text-muted ${FOCUS}`;
const INPUT = `w-full rounded border border-line bg-canvas px-2 py-1 font-sans text-xs text-ink ${FOCUS}`;

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea className={TEXTAREA} {...props} />;
}

export function Input(props: ComponentProps<"input">) {
  return <input className={INPUT} {...props} />;
}
