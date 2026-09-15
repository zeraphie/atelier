import { useUiStore } from "../comments/ui-store.js";

const BUTTON =
  "flex h-8 items-center gap-2 px-3 font-sans text-sm text-ink hover:bg-canvas active:bg-line " +
  "aria-pressed:bg-accent aria-pressed:text-accent-ink aria-pressed:hover:bg-accent " +
  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2";

/** The tools: for now, one, which makes the next tap on the canvas place a comment. */
export function Toolbar() {
  const mode = useUiStore((store) => store.mode);
  const setMode = useUiStore((store) => store.setMode);
  const isCommenting = mode === "comment";
  return (
    <div className="absolute top-4 left-4 flex overflow-hidden rounded-md border border-line bg-surface shadow-sm">
      <button
        type="button"
        className={BUTTON}
        aria-pressed={isCommenting}
        title="Comment (C)"
        onClick={() => setMode(isCommenting ? "browse" : "comment")}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M2 2.5h10v7H6l-3 2.5v-2.5H2z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
        Comment
      </button>
    </div>
  );
}
