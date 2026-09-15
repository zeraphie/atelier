import { useState } from "react";
import type { Comment, Thread as ThreadModel } from "../comments/model.js";
import { useCommentsStore } from "../comments/store.js";
import { whenWas } from "../comments/when.js";
import { CommentForm } from "./CommentForm.js";
import { useNow } from "./use-now.js";

const QUIET =
  "rounded-md px-2 py-1 font-sans text-xs text-muted hover:bg-canvas hover:text-ink " +
  "focus-visible:outline-2 focus-visible:outline-accent";

/** One thread, opened: its comments, a reply, and resolve or reopen. */
export function Thread({ thread }: { readonly thread: ThreadModel }) {
  const reply = useCommentsStore((store) => store.reply);
  const resolve = useCommentsStore((store) => store.resolve);
  return (
    <div className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {thread.comments.map((comment) => (
          <li key={comment.id}>
            <CommentView thread={thread} comment={comment} />
          </li>
        ))}
      </ol>
      <CommentForm
        placeholder="Reply"
        submitLabel="Reply"
        onSubmit={(text) => reply(thread.id, text)}
      />
      <div className="flex items-center justify-between border-t border-line pt-2">
        <span
          className="font-sans text-xs text-muted data-[resolved=true]:text-resolved"
          data-resolved={thread.resolved}
        >
          {thread.resolved ? "Resolved" : "Open"}
        </span>
        <button
          type="button"
          className={QUIET}
          onClick={() => resolve(thread.id, !thread.resolved)}
        >
          {thread.resolved ? "Reopen" : "Resolve"}
        </button>
      </div>
    </div>
  );
}

// One comment: who, when, the text, and an edit for the person who wrote it.
function CommentView({
  thread,
  comment,
}: {
  readonly thread: ThreadModel;
  readonly comment: Comment;
}) {
  const author = useCommentsStore((store) => store.author);
  const edit = useCommentsStore((store) => store.edit);
  const [isEditing, setEditing] = useState(false);
  const now = useNow();
  const isMine = comment.author === author;
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
            edit(thread.id, comment.id, text);
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
          <button type="button" className={QUIET} onClick={() => setEditing(true)}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
