/**
 * ─ Text button ─
 *
 * A button that is a word: the one action of a form, in the accent,
 * or a quiet one beside it.
 */

import type { ComponentProps } from "react";
import { FOCUS_RING } from "./styles.js";

const BASE = `rounded-md px-3 py-1.5 font-sans text-sm ${FOCUS_RING} focus-visible:outline-offset-2`;
const TONES = {
  primary:
    "bg-accent font-bold text-accent-ink hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100",
  quiet: "text-muted hover:bg-canvas hover:text-ink",
} as const;

/** A button that is a word: the one action of a form, or a quiet one beside it. */
export function TextButton({
  tone = "quiet",
  className = "",
  ...props
}: ComponentProps<"button"> & { readonly tone?: keyof typeof TONES }) {
  return <button type="button" className={`${BASE} ${TONES[tone]} ${className}`} {...props} />;
}
