/**
 * ─ Arrival ─
 *
 * The card under the mark, once the loader has said its piece and
 * the stores are in, before the curtain parts: one line saying who
 * you are coming in as, the colour as a dot, the name and the viewing's
 * code, with a pen to change any of them and Come in. The pen grows
 * the card in place to two rows of fields, the name and the code with
 * New code, then the colours, with Come in there too. Everything is
 * offered from the store, or made fresh; accepting is one press. The
 * card cannot be dismissed any other way.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { Dialog } from "radix-ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useOwnStore } from "../../state/own-store.js";
import { arrive, offeredCode } from "../../viewing/identity/arrival.js";
import { newViewingCode } from "../../viewing/identity/code.js";
import { colorOf, swatchIdFor } from "../../viewing/identity/color.js";
import { CARD } from "../atoms/Card.js";
import { PenIcon } from "../atoms/icons.js";
import { personStyle, PERSON, TOOL } from "../atoms/styles.js";
import { TextButton } from "../atoms/TextButton.js";
import { CodeField, ColourField, NameField } from "../molecules/IdentityFields.js";
import { whenHydrated } from "../../storage/index.js";
import { whenLoaderDone } from "../utils/curtain.js";

// Above the curtain, which sits at 999, and under its mark: the mark is centred in the
// window and min(70vw, 440px) wide by 0.235 of that tall, so its foot is 0.1175 of its
// width below the middle. The card is as wide as its line, and wider once it holds the
// fields; the width eases between the two where the browser can interpolate from a
// fitted width, and jumps where it cannot; the rows fold and unfold below.
// Written out in full, since Tailwind reads the classes off the source.
const CONTENT =
  `${CARD} fixed left-1/2 z-[1000] -translate-x-1/2 max-w-[calc(100vw-2rem)] p-3 outline-none ` +
  "top-[calc(50%_+_min(70vw,440px)_*_0.1175_+_1.5rem)] [interpolate-size:allow-keywords] " +
  "transition-[width] duration-200 ease-out motion-reduce:transition-none " +
  "data-[editing=false]:w-fit data-[editing=true]:w-[33rem]";
// A region of the card that folds to nothing or unfolds to its height.
const FOLD =
  "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none " +
  "data-[shown=true]:grid-rows-[1fr] data-[shown=false]:grid-rows-[0fr]";
// What a fold clips: its content, with a margin for a focus ring to show whole.
const FOLDED = "min-h-0 overflow-clip [overflow-clip-margin:4px]";
const DOT = `${PERSON} size-3.5 flex-none rounded-full`;
const PEN = `${TOOL} size-8 flex-none rounded-md`;

export function Arrival() {
  const name = useOwnStore((store) => store.name);
  const color = useOwnStore((store) => store.color);
  const [isReady, setReady] = useState(false);
  const [isIn, setIn] = useState(false);
  useEffect(() => {
    // The stores as well as the loader: the name, the home and the viewings offered are theirs.
    Promise.all([whenLoaderDone(), whenHydrated()]).then(() => setReady(true), reportError);
  }, []);
  const come = (details: { code: string; name: string; color: string }): void => {
    arrive(details.code, details.name, details.color).then(() => setIn(true), reportError);
  };
  return (
    <Dialog.Root open={isReady && !isIn}>
      <Dialog.Portal>
        {isReady && !isIn && (
          <ArrivalCard name={name} color={swatchIdFor(name, color)} onComeIn={come} />
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ArrivalCard({
  name: givenName,
  color: givenColor,
  onComeIn,
}: {
  readonly name: string;
  readonly color: string;
  readonly onComeIn: (details: { code: string; name: string; color: string }) => void;
}) {
  const [offered] = useState(offeredCode);
  const [code, setCode] = useState(offered.code);
  const [name, setName] = useState(givenName);
  const [color, setColor] = useState(givenColor);
  const [isEditing, setEditing] = useState(false);
  const [isGoing, setGoing] = useState(false);
  // The card itself takes the focus as it opens, so nothing wears a ring until Tab, and
  // Enter on the card comes in.
  const content = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const trimmed = code.trim().toLowerCase();
  const isValid = trimmed !== "" && name.trim() !== "";
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!isValid || isGoing) {
      return;
    }
    setGoing(true);
    onComeIn({ code: trimmed, name: name.trim(), color });
  };
  const isDisabled = !isValid || isGoing;
  return (
    <Dialog.Content
      className={CONTENT}
      data-editing={isEditing}
      ref={content}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        content.current?.focus({ preventScroll: true });
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget) {
          event.preventDefault();
          form.current?.requestSubmit();
        }
      }}
      onEscapeKeyDown={(event) => event.preventDefault()}
      onPointerDownOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <Dialog.Title className="sr-only">Before you come in</Dialog.Title>
      <Dialog.Description className="sr-only">
        Who you are coming in as, and which viewing; the pen changes them.
      </Dialog.Description>
      <form ref={form} onSubmit={submit}>
        <div className={FOLD} data-shown={!isEditing} inert={isEditing}>
          <div className={`${FOLDED} flex items-center gap-3 pl-2`}>
            <span className={DOT} style={personStyle(colorOf(color))} aria-hidden="true" />
            {/* A name up to twenty characters shows whole; a longer one is cut with a mark. */}
            <span className="max-w-[20ch] truncate font-serif text-lg text-ink">
              {name.trim() || "Visitor"}
            </span>
            <span className="text-line" aria-hidden="true">
              ·
            </span>
            <span className="font-mono text-xs tracking-wider text-muted">{trimmed}</span>
            <span className="flex-1" />
            <button
              type="button"
              className={PEN}
              aria-label="Change your name, colour or viewing"
              title="Change your name, colour or viewing"
              onClick={() => setEditing(true)}
            >
              <PenIcon />
            </button>
            <TextButton tone="primary" type="submit" disabled={isDisabled}>
              Come in
            </TextButton>
          </div>
        </div>
        {/* Its inline size contained, so the folded rows never widen the card's fitted line. */}
        <div className={`${FOLD} contain-inline-size`} data-shown={isEditing} inert={!isEditing}>
          <div className={`${FOLDED} flex flex-col gap-3 px-1 pt-1`}>
            <div className="flex flex-wrap items-start gap-3">
              <NameField
                idPrefix="arrive"
                name={name}
                className="min-w-40 flex-1"
                onName={setName}
              />
              <CodeField
                idPrefix="arrive"
                code={code}
                onCode={setCode}
                onNewCode={() => setCode(newViewingCode())}
              />
            </div>
            <div className="flex flex-wrap items-end gap-3 pb-1">
              <ColourField color={color} onColor={setColor} />
              <span className="flex-1" />
              <TextButton tone="primary" type="submit" className="mb-0.5" disabled={isDisabled}>
                Come in
              </TextButton>
            </div>
          </div>
        </div>
      </form>
    </Dialog.Content>
  );
}
