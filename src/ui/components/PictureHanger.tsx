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
import { useEffect, useRef, useState } from "react";
import {
  derivativeKey,
  heightFor,
  preparePicture,
  type PreparedPicture,
} from "../../pictures/prepare.js";
import { useOwnStore } from "../../state/own-store.js";
import { useStore } from "../../state/store.js";
import { putPicture } from "../../storage/index.js";
import { DIALOG_CONTENT, DIALOG_OVERLAY, DIALOG_TITLE } from "../atoms/Card.js";
import { PictureDetailsForm, type PictureDetails } from "../molecules/PictureDetailsForm.js";

interface Pending {
  readonly prepared: PreparedPicture;
  /** The file's name without its extension: the title until one is typed. */
  readonly name: string;
  /** An object URL of the derivative for the preview, revoked when the form closes. */
  readonly preview: string;
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
              <PictureDetailsForm
                key={pending.prepared.id}
                preview={pending.preview}
                name={pending.name}
                size={pending.prepared.size}
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
