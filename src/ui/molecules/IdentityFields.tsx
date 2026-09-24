/**
 * ─ Identity fields ─
 *
 * Who you are here and where, as three fields: the viewing's code
 * with a button for a new one, the name, and the colour. Each is a
 * molecule of its own, so the arrival card can lay them in rows and
 * the Studio desk stack them, and `IdentityFields` is the stack.
 * Values in, changes out; a code or a name is also reported done on
 * Enter or on leaving the field, for a desk that keeps each change as
 * it is made.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { KeyboardEvent } from "react";
import { FIELD, FieldLabel, Input } from "../atoms/Field.js";
import { FOCUS_RING } from "../atoms/styles.js";
import { ColorPicker } from "./ColorPicker.js";

// New code stands beside the code's input as a box of the same height, so the two read as one row.
const NEW_CODE = `${FOCUS_RING} rounded border border-line bg-surface px-2 py-1 font-sans text-xs whitespace-nowrap text-ink hover:bg-canvas`;

const doneOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
  if (event.key === "Enter") {
    event.currentTarget.blur();
  }
};

/** The viewing's code, with a button for a new one; `note` is a line under it. */
export function CodeField({
  idPrefix,
  code,
  note,
  className = "",
  onCode,
  onNewCode,
  onCodeDone,
}: {
  /** What this place's fields are known by, so two places never share an id. */
  readonly idPrefix: string;
  readonly code: string;
  readonly note?: string;
  readonly className?: string;
  readonly onCode: (code: string) => void;
  /** New code was pressed: the caller makes one and keeps it. */
  readonly onNewCode: () => void;
  readonly onCodeDone?: () => void;
}) {
  return (
    <div className={`${FIELD} ${className}`}>
      <label htmlFor={`${idPrefix}-code`}>Viewing code</label>
      <span className="flex items-center gap-2">
        {/* The input is as wide as its box, so the box says how wide a code is. */}
        <span className="w-36">
          <Input
            id={`${idPrefix}-code`}
            className="font-mono tracking-wider"
            value={code}
            spellCheck={false}
            onChange={(event) => onCode(event.target.value)}
            onKeyDown={doneOnEnter}
            onBlur={onCodeDone}
          />
        </span>
        <button type="button" className={NEW_CODE} onClick={onNewCode}>
          New code
        </button>
      </span>
      {note !== undefined && <span>{note}</span>}
    </div>
  );
}

/** The name, as a label with its input. */
export function NameField({
  idPrefix,
  name,
  className = "",
  onName,
  onNameDone,
}: {
  readonly idPrefix: string;
  readonly name: string;
  readonly className?: string;
  readonly onName: (name: string) => void;
  readonly onNameDone?: () => void;
}) {
  return (
    <FieldLabel htmlFor={`${idPrefix}-name`} className={className}>
      Your name
      <Input
        id={`${idPrefix}-name`}
        value={name}
        onChange={(event) => onName(event.target.value)}
        onKeyDown={doneOnEnter}
        onBlur={onNameDone}
      />
    </FieldLabel>
  );
}

/** The colour, as the eight circles under their caption. */
export function ColourField({
  color,
  className = "",
  onColor,
}: {
  readonly color: string;
  readonly className?: string;
  readonly onColor: (color: string) => void;
}) {
  return (
    <div className={`${FIELD} ${className}`}>
      <span>Your colour</span>
      <ColorPicker value={color} onChange={onColor} />
    </div>
  );
}

/** The three fields stacked: the code, the name, the colour. */
export function IdentityFields({
  idPrefix,
  code,
  name,
  color,
  onCode,
  onName,
  onColor,
  onNewCode,
  onCodeDone,
  onNameDone,
}: {
  readonly idPrefix: string;
  readonly code: string;
  readonly name: string;
  readonly color: string;
  readonly onCode: (code: string) => void;
  readonly onName: (name: string) => void;
  readonly onColor: (color: string) => void;
  readonly onNewCode: () => void;
  readonly onCodeDone?: () => void;
  readonly onNameDone?: () => void;
}) {
  return (
    <>
      <CodeField
        idPrefix={idPrefix}
        code={code}
        onCode={onCode}
        onNewCode={onNewCode}
        onCodeDone={onCodeDone}
      />
      <NameField idPrefix={idPrefix} name={name} onName={onName} onNameDone={onNameDone} />
      <ColourField color={color} onColor={onColor} />
    </>
  );
}
