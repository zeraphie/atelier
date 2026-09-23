/**
 * ─ Picture hanger ─
 *
 * Hanging a picture of your own: asked at a point, a file is chosen and
 * prepared in memory, its hash, a derivative and its colour, and its
 * details are asked for in a form: title, artist, year, credit, a
 * description in your own words, and the width it hangs at. Hang keeps
 * the bytes in the picture store, the record in your collection and
 * the hanging in the gallery, at the point asked; Cancel leaves nothing.
 * Decision: DECISIONS.md, a picture and its hanging are two things.
 */

import { Dialog } from "radix-ui";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { derivativeKey, preparePicture, type PreparedPicture } from "../../pictures/prepare.js";
import { useOwnStore } from "../../state/own-store.js";
import { useStore } from "../../state/store.js";
import { putPicture } from "../../storage/index.js";
import { DIALOG_CONTENT, DIALOG_OVERLAY, DIALOG_TITLE } from "../atoms/Card.js";
import { FieldLabel, Input, Textarea } from "../atoms/Field.js";
import { TextButton } from "../atoms/TextButton.js";
import { toTenth } from "../../geometry.js";

/** How wide a picture hangs unless the form says otherwise, in centimetres. */
const DEFAULT_WIDTH_CM = 60;
interface Pending {
  readonly prepared: PreparedPicture;
  /** The file's name without its extension: the title until one is typed. */
  readonly name: string;
  /** An object URL of the derivative for the preview, revoked when the form closes. */
  readonly preview: string;
}

interface PictureDetails {
  readonly title: string;
  readonly artist: string;
  readonly year: string;
  readonly credit: string;
  readonly description: string;
  readonly widthCm: number;
}

export function PictureHanger() {
  const hangingAt = useStore((store) => store.hangingAt);
  const askPicture = useStore((store) => store.askPicture);
  const hang = useStore((store) => store.hang);
  const addPicture = useOwnStore((store) => store.addPicture);
  const userId = useOwnStore((store) => store.userId);
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | undefined>(undefined);

  // Asked for a picture and none chosen yet: the file dialog opens.
  useEffect(() => {
    if (hangingAt !== undefined && pending === undefined) {
      fileInput.current?.click();
    }
  }, [hangingAt, pending]);
  // The file dialog dismissed with nothing chosen: the asking ends.
  useEffect(() => {
    const input = fileInput.current;
    if (input === null) {
      return;
    }
    const onCancel = (): void => askPicture(undefined);
    input.addEventListener("cancel", onCancel);
    return () => {
      input.removeEventListener("cancel", onCancel);
    };
  }, [askPicture]);

  const chosen = (file: File | undefined): void => {
    if (file === undefined) {
      askPicture(undefined);
      return;
    }
    preparePicture(file).then(
      (prepared) => {
        setPending({
          prepared,
          name: file.name.replace(/\.[^.]+$/, ""),
          preview: URL.createObjectURL(prepared.derivative),
        });
      },
      (error: unknown) => {
        reportError(error);
        askPicture(undefined);
      }
    );
  };
  const close = (): void => {
    if (pending !== undefined) {
      URL.revokeObjectURL(pending.preview);
    }
    setPending(undefined);
    askPicture(undefined);
  };
  // The bytes first, so nothing points at a picture that is not there yet.
  const hangIt = async (details: PictureDetails): Promise<void> => {
    if (pending === undefined || hangingAt === undefined) {
      return;
    }
    const { prepared } = pending;
    await putPicture(prepared.id, prepared.original);
    await putPicture(derivativeKey(prepared.id), prepared.derivative);
    addPicture({
      id: prepared.id,
      ...details,
      heightCm: heightFor(details.widthCm, prepared.size),
      color: prepared.color,
      size: prepared.size,
    });
    hang({
      id: crypto.randomUUID(),
      by: userId,
      pictureId: prepared.id,
      at: hangingAt,
      widthCm: details.widthCm,
    });
    close();
  };

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="A picture to hang"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          chosen(file);
        }}
      />
      <Dialog.Root
        open={pending !== undefined}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            close();
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={DIALOG_OVERLAY} />
          <Dialog.Content className={DIALOG_CONTENT}>
            <Dialog.Title className={DIALOG_TITLE}>Hang a picture</Dialog.Title>
            <Dialog.Description className="sr-only">
              The picture's details, and how wide it hangs.
            </Dialog.Description>
            {pending !== undefined && (
              <HangForm
                key={pending.prepared.id}
                pending={pending}
                onCancel={close}
                onHang={(details) => {
                  hangIt(details).catch(reportError);
                }}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// The height a picture hangs at for a width, from its proportions, to a millimetre.
function heightFor(widthCm: number, size: { readonly width: number; readonly height: number }) {
  return toTenth((widthCm * size.height) / size.width);
}

// The form from the design, with the file's name as the title to start.
function HangForm({
  pending,
  onCancel,
  onHang,
}: {
  readonly pending: Pending;
  readonly onCancel: () => void;
  readonly onHang: (details: PictureDetails) => void;
}) {
  const [title, setTitle] = useState(pending.name);
  const [artist, setArtist] = useState("");
  const [year, setYear] = useState("");
  const [credit, setCredit] = useState("");
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState(String(DEFAULT_WIDTH_CM));
  const widthCm = Number(width);
  const isValid = title.trim() !== "" && Number.isFinite(widthCm) && widthCm > 0;
  const { size } = pending.prepared;
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (isValid) {
      onHang({
        title: title.trim(),
        artist: artist.trim(),
        year: year.trim(),
        credit: credit.trim(),
        description: description.trim(),
        widthCm,
      });
    }
  };
  return (
    <form className="flex flex-col gap-3" onSubmit={submit}>
      <img
        src={pending.preview}
        alt=""
        className="max-h-40 self-center rounded border border-line object-contain"
      />
      <FieldLabel htmlFor="picture-title">
        Title
        <Input id="picture-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldLabel>
      <div className="grid grid-cols-[1fr_5rem] gap-3">
        <FieldLabel htmlFor="picture-artist">
          Artist
          <Input id="picture-artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
        </FieldLabel>
        <FieldLabel htmlFor="picture-year">
          Year
          <Input id="picture-year" value={year} onChange={(e) => setYear(e.target.value)} />
        </FieldLabel>
      </div>
      <FieldLabel htmlFor="picture-credit">
        Credit
        <Input id="picture-credit" value={credit} onChange={(e) => setCredit(e.target.value)} />
      </FieldLabel>
      <FieldLabel htmlFor="picture-description">
        Description
        <Textarea
          id="picture-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FieldLabel>
      <FieldLabel htmlFor="picture-width" className="w-32">
        Width
        <span className="flex items-center gap-2">
          <Input
            id="picture-width"
            type="number"
            inputMode="decimal"
            min={1}
            step="any"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
          <span className="text-ink">cm</span>
        </span>
      </FieldLabel>
      <p className="font-sans text-xs text-muted">
        {isValid
          ? `Hangs ${Math.round(widthCm)} × ${Math.round(heightFor(widthCm, size))} cm`
          : "A title and a width, please"}
        , from {size.width} × {size.height} px.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <TextButton type="button" onClick={onCancel}>
          Cancel
        </TextButton>
        <TextButton tone="primary" type="submit" disabled={!isValid}>
          Hang
        </TextButton>
      </div>
    </form>
  );
}
