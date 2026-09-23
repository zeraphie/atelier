/**
 * ─ Identity fields ─
 *
 * Who you are here and where: the viewing's code with a button for a
 * new one, the name, and the colour, as one set of fields the arrival
 * card and the Studio desk share. Values in, changes out; a code or a
 * name is also reported done on Enter or on leaving the field, for a
 * desk that keeps each change as it is made.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { KeyboardEvent } from "react";
import { newViewingCode } from "../../viewing/code.js";
import { Input } from "../atoms/Field.js";
import { TextButton } from "../atoms/TextButton.js";
import { ColorPicker } from "./ColorPicker.js";

const LABEL = "flex flex-col gap-1 font-sans text-xs text-muted";

export function IdentityFields({
  idPrefix,
  code,
  name,
  color,
  codeNote,
  onCode,
  onName,
  onColor,
  onCodeDone,
  onNameDone,
}: {
  /** What this place's fields are known by, so two places never share an id. */
  readonly idPrefix: string;
  readonly code: string;
  readonly name: string;
  readonly color: string;
  /** A line under the code, saying where it came from or what to do with it. */
  readonly codeNote?: string;
  readonly onCode: (code: string) => void;
  readonly onName: (name: string) => void;
  readonly onColor: (color: string) => void;
  readonly onCodeDone?: () => void;
  readonly onNameDone?: () => void;
}) {
  const doneOnEnter = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  };
  return (
    <>
      <div className={LABEL}>
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
          <TextButton
            type="button"
            className="whitespace-nowrap"
            onClick={() => {
              onCode(newViewingCode());
              onCodeDone?.();
            }}
          >
            New code
          </TextButton>
        </span>
        {codeNote !== undefined && <span>{codeNote}</span>}
      </div>
      <label htmlFor={`${idPrefix}-name`} className={LABEL}>
        Your name
        <Input
          id={`${idPrefix}-name`}
          value={name}
          onChange={(event) => onName(event.target.value)}
          onKeyDown={doneOnEnter}
          onBlur={onNameDone}
        />
      </label>
      <div className={LABEL}>
        <span>Your colour</span>
        <ColorPicker value={color} onChange={onColor} />
      </div>
    </>
  );
}
