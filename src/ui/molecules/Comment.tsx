/**
 * ─ Comment ─
 *
 * One comment as it reads: who, when, the text, and, for the person
 * who wrote it, a way to change it. Whose it is and what an edit does
 * come in as props; it holds only whether it is being edited.
 */

import { useState } from "react";
import type { Comment as CommentModel } from "../../comments/model.js";
import { whenWas } from "../../comments/when.js";
import { TextButton } from "../atoms/TextButton.js";
import { useNow } from "../utils/use-now.js";
import { CommentForm } from "./CommentForm.js";

interface CommentProps {
  readonly comment: CommentModel;
  readonly isMine: boolean;
  readonly onEdit: (text: string) => void;
}

/** One comment as it reads: who, when, the text, and for its author a way to change it. */
export function Comment({ comment, isMine, onEdit }: CommentProps) {
  const [isEditing, setEditing] = useState(false);
  const now = useNow();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-sm font-bold text-ink">{comment.author}</span>
        <span className="font-mono text-xs text-muted">
          {whenWas(comment.createdAt, now)}
          {comment.editedAt !== undefined && ", edited"}
        </span>
      </div>
      {isEditing ? (
        <CommentForm
          placeholder="Edit the comment"
          submitLabel="Save"
          initial={comment.text}
          onSubmit={(text) => {
            onEdit(text);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <p className="whitespace-pre-wrap font-serif text-base leading-snug text-ink">
          {comment.text}
        </p>
      )}
      {isMine && !isEditing && (
        <div className="flex justify-end">
          <TextButton onClick={() => setEditing(true)}>Edit</TextButton>
        </div>
      )}
    </div>
  );
}
