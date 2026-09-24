/**
 * ─ Dev handle ─
 *
 * In development only, the stores and the plan on the window, so the
 * console can act on the gallery before the interface for an action
 * exists: `atelier.store.getState().moveWork("hokusai-great-wave", { x: 150, y: 100 })`,
 * `atelier.store.getState().renameRoom("foyer", "Hall")`, `atelier.store.getState().reset()`,
 * and putting everything back as a viewing does it: `atelier.proposeReset()`,
 * `atelier.answerReset(true)`, `atelier.confirmReset()`, `atelier.withdrawReset()`.
 */

import { answerReset, confirmReset, proposeReset, withdrawReset } from "../../viewing/proposal.js";
import { currentPeers } from "../../viewing/viewing.js";
import { useOwnStore } from "../own-store.js";
import { currentPlan } from "./plan.js";
import { useStore } from "../store.js";

if (import.meta.env.DEV) {
  Object.assign(globalThis, {
    atelier: {
      store: useStore,
      own: useOwnStore,
      plan: currentPlan,
      viewingPeers: currentPeers,
      proposeReset,
      answerReset,
      confirmReset,
      withdrawReset,
    },
  });
}
