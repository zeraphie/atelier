/**
 * ─ Arrival ─
 *
 * The card under the mark, once the loader has said its piece and
 * before the curtain parts: which viewing, by code, the address's or
 * this browser's own or a new one; the name as it stands; and one of
 * the eight colours. Come in keeps them, joins the viewing and lets the
 * curtain rise. It cannot be dismissed any other way, and accepting
 * what it offers is one press.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { Dialog } from "radix-ui";
import { useEffect, useState, type FormEvent } from "react";
import { useOwnStore } from "../../state/own-store.js";
import { arrive, offeredCode } from "../../viewing/arrival.js";
import { swatchIdFor } from "../../viewing/color.js";
import { CARD } from "../atoms/Card.js";
import { TextButton } from "../atoms/TextButton.js";
import { IdentityFields } from "../molecules/IdentityFields.js";
import { whenLoaderDone } from "../utils/curtain.js";

// Above the curtain, which sits at 999, and under its mark: the mark is centred in the
// window and min(70vw, 440px) wide by 0.235 of that tall, so its foot is 0.1175 of its
// width below the middle; the card starts a little under that, and on a window too short
// for it the fields scroll between the title and Come in, which stay put. Written out in
// full, since Tailwind reads the classes off the source.
const CONTENT =
  `${CARD} fixed left-1/2 z-[1000] flex w-96 max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col gap-3 ` +
  "p-5 top-[calc(50%_+_min(70vw,440px)_*_0.1175_+_1.5rem)] " +
  "max-h-[calc(50%_-_min(70vw,440px)_*_0.1175_-_2.5rem)]";

export function Arrival() {
  const name = useOwnStore((store) => store.name);
  const color = useOwnStore((store) => store.color);
  const [isReady, setReady] = useState(false);
  const [isIn, setIn] = useState(false);
  useEffect(() => {
    whenLoaderDone().then(() => setReady(true), reportError);
  }, []);
  const come = (details: { code: string; name: string; color: string }): void => {
    arrive(details.code, details.name, details.color).then(() => setIn(true), reportError);
  };
  return (
    <Dialog.Root open={isReady && !isIn}>
      <Dialog.Portal>
        <Dialog.Content
          className={CONTENT}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <Dialog.Title className="font-sans text-base font-bold text-ink">
            Before you come in
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Which viewing to join, your name, and your colour.
          </Dialog.Description>
          {isReady && !isIn && (
            <ArrivalForm name={name} color={swatchIdFor(name, color)} onComeIn={come} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ArrivalForm({
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
  const [isGoing, setGoing] = useState(false);
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
  return (
    <form className="flex min-h-0 flex-col gap-3" onSubmit={submit}>
      {/* What scrolls on a short window; a little side room keeps the swatches' rings in view. */}
      <div className="-mx-1 flex min-h-0 flex-col gap-3 overflow-x-hidden overflow-y-auto px-1">
        <IdentityFields
          idPrefix="arrive"
          code={code}
          name={name}
          color={color}
          codeNote={
            offered.isNew
              ? "A viewing of your own, made just now. Type a code to join someone else's."
              : "Change it to join another viewing, or make a new one."
          }
          onCode={setCode}
          onName={setName}
          onColor={setColor}
        />
        <p className="font-serif text-sm leading-snug text-muted">
          The others here see your name and colour beside your comments and your cursor. Both are
          yours to change at the desk later.
        </p>
      </div>
      <div className="flex justify-end pt-1">
        <TextButton tone="primary" type="submit" disabled={!isValid || isGoing}>
          Come in
        </TextButton>
      </div>
    </form>
  );
}
