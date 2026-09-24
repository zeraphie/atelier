/**
 * ─ Bring comments ─
 *
 * The threads of another viewing this browser has been in, replayed
 * here: each is told as it comes, so the peers here have it too, and
 * the stamps merge the usual way. Read from the saved state, so a
 * viewing not open still gives up its comments.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import type { Thread } from "../comments/model.js";
import { useStore } from "../state/store.js";
import { keyForViewing } from "../state/utils/gallery-key.js";
import { stateStorage } from "../storage/index.js";

/** Replay another viewing's saved threads here, telling each; how many came. */
export async function bringCommentsFrom(code: string): Promise<number> {
  const saved = await stateStorage.getItem(keyForViewing(code));
  if (saved === null) {
    return 0;
  }
  const { state } = JSON.parse(saved) as { state?: { threads?: Thread[] } };
  const threads = state?.threads ?? [];
  const { putThread } = useStore.getState();
  for (const thread of threads) {
    putThread(thread);
  }
  return threads.length;
}
