/**
 * ─ Comment form ─
 *
 * A place to write a comment: Enter sends, Shift+Enter breaks a line,
 * Escape cancels. What it is for comes in as words and a callback; it
 * holds only the text being typed.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Textarea } from "../atoms/Field.js";
import { TextButton } from "../atoms/TextButton.js";

interface CommentFormProps {
  readonly placeholder: string;
  readonly submitLabel: string;
  readonly initial?: string;
  readonly onSubmit: (text: string) => void;
  readonly onCancel?: () => void;
}

/** A place to write a comment: Enter sends, Shift+Enter breaks a line, Escape cancels. */
export function CommentForm({
  placeholder,
  submitLabel,
  initial = "",
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [text, setText] = useState(initial);
  const field = useRef<HTMLTextAreaElement>(null);
  // The form appears to be written in, so the cursor goes straight to it.
  useEffect(() => {
    field.current?.focus();
  }, []);
  const trimmed = text.trim();
  const send = (): void => {
    if (trimmed !== "") {
      onSubmit(trimmed);
      setText("");
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    } else if (event.key === "Escape" && onCancel !== undefined) {
      event.preventDefault();
      onCancel();
    }
  };
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <Textarea
        rows={3}
        placeholder={placeholder}
        aria-label={placeholder}
        value={text}
        ref={field}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="flex justify-end gap-2">
        {onCancel !== undefined && <TextButton onClick={onCancel}>Cancel</TextButton>}
        <TextButton tone="primary" type="submit" disabled={trimmed === ""}>
          {submitLabel}
        </TextButton>
      </div>
    </form>
  );
}
