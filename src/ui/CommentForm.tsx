import { useEffect, useRef, useState, type KeyboardEvent } from "react";

interface CommentFormProps {
  readonly placeholder: string;
  readonly submitLabel: string;
  readonly initial?: string;
  readonly onSubmit: (text: string) => void;
  readonly onCancel?: () => void;
}

const FIELD =
  "w-full resize-none rounded-md border border-line bg-surface px-3 py-2 font-serif text-base leading-snug " +
  "text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent";
const PRIMARY =
  "rounded-md bg-accent px-3 py-1.5 font-sans text-sm font-bold text-accent-ink hover:brightness-110 " +
  "disabled:opacity-40 disabled:hover:brightness-100 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2";
const QUIET =
  "rounded-md px-3 py-1.5 font-sans text-sm text-muted hover:bg-canvas focus-visible:outline-2 focus-visible:outline-accent";

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
      <textarea
        className={FIELD}
        rows={3}
        placeholder={placeholder}
        aria-label={placeholder}
        value={text}
        ref={field}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKeyDown}
      />
      <div className="flex justify-end gap-2">
        {onCancel !== undefined && (
          <button type="button" className={QUIET} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className={PRIMARY} disabled={trimmed === ""}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
