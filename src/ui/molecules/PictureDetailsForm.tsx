/**
 * ─ Picture details form ─
 *
 * The form for a picture about to be hung: its title, artist, year,
 * credit, a description in your own words, and the width it hangs
 * at, with the height that follows from its proportions. The
 * picture's preview and its size come in; the details go out on Hang.
 * Decision: DECISIONS.md, a picture and its hanging are two things.
 */

import { useState, type FormEvent } from "react";
import { heightFor } from "../../pictures/prepare.js";
import { FieldLabel, Input, Textarea } from "../atoms/Field.js";
import { TextButton } from "../atoms/TextButton.js";

/** How wide a picture hangs unless the form says otherwise, in centimetres. */
const DEFAULT_WIDTH_CM = 60;

/** What the form asks for, trimmed. */
export interface PictureDetails {
  readonly title: string;
  readonly artist: string;
  readonly year: string;
  readonly credit: string;
  readonly description: string;
  readonly widthCm: number;
}

/** The details of a picture to hang, with the file's name as the title to start. */
export function PictureDetailsForm({
  preview,
  name,
  size,
  onCancel,
  onHang,
}: {
  /** An object URL of the picture, for the preview. */
  readonly preview: string;
  /** The file's name without its extension. */
  readonly name: string;
  readonly size: { readonly width: number; readonly height: number };
  readonly onCancel: () => void;
  readonly onHang: (details: PictureDetails) => void;
}) {
  const [title, setTitle] = useState(name);
  const [artist, setArtist] = useState("");
  const [year, setYear] = useState("");
  const [credit, setCredit] = useState("");
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState(String(DEFAULT_WIDTH_CM));
  const widthCm = Number(width);
  const isValid = title.trim() !== "" && Number.isFinite(widthCm) && widthCm > 0;
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
        src={preview}
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
