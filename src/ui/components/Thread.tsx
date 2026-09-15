/**
 * ─ Thread ─
 *
 * One thread, opened: its comments, a reply, and resolve or reopen.
 * This is where the store is read and written; each comment below it
 * is told whose it is and handed what an edit does.
 */

import type { Thread as ThreadModel } from "../../comments/model.js";
import { useCommentsStore } from "../../comments/store.js";
import { TextButton } from "../atoms/TextButton.js";
import { Comment } from "../molecules/Comment.js";
import { CommentForm } from "../molecules/CommentForm.js";

export function Thread({ thread }: { readonly thread: ThreadModel }) {
  const author = useCommentsStore((store) => store.author);
  const edit = useCommentsStore((store) => store.edit);
  const reply = useCommentsStore((store) => store.reply);
  const resolve = useCommentsStore((store) => store.resolve);
  return (
    <div className="flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {thread.comments.map((comment) => (
          <li key={comment.id}>
            <Comment
              comment={comment}
              isMine={comment.author === author}
              onEdit={(text) => edit(thread.id, comment.id, text)}
            />
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
        <TextButton onClick={() => resolve(thread.id, !thread.resolved)}>
          {thread.resolved ? "Reopen" : "Resolve"}
        </TextButton>
      </div>
    </div>
  );
}
