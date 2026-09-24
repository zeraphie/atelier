/**
 * ─ Colour picker ─
 *
 * The eight colours as a row of circles, one chosen: a radio group, so
 * the arrow keys move between them and each is named for a screen
 * reader. Props in, the choice out; where it is kept is the caller's.
 * Decision: DECISIONS.md, identity is a name and a colour.
 */

import { RadioGroup } from "radix-ui";
import type { CSSProperties } from "react";
import { colorOf, PALETTE } from "../../viewing/identity/color.js";
import { FOCUS_RING } from "../atoms/styles.js";

const SWATCH =
  "size-7 rounded-full bg-[var(--swatch)] ring-surface transition-[box-shadow] " +
  `hover:ring-2 ${FOCUS_RING} focus-visible:outline-offset-2 ` +
  "data-[state=checked]:ring-2 data-[state=checked]:shadow-[0_0_0_4px_var(--color-ink)]";

/** The eight colours as a row of circles, one chosen. */
export function ColorPicker({
  value,
  onChange,
  label = "Your colour",
}: {
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly label?: string;
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onChange}
      aria-label={label}
      orientation="horizontal"
      className="flex gap-2.5 py-0.5"
    >
      {PALETTE.map((swatch) => (
        <RadioGroup.Item
          key={swatch.id}
          value={swatch.id}
          aria-label={swatch.name}
          title={swatch.name}
          className={SWATCH}
          style={{ "--swatch": colorOf(swatch.id) } as CSSProperties}
        />
      ))}
    </RadioGroup.Root>
  );
}
