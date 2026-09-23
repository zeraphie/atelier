/**
 * ─ Dev handle ─
 *
 * In development only, the stores and the plan on the window, so the
 * console can act on the gallery before the interface for an action
 * exists: `atelier.store.getState().moveWork("hokusai-great-wave", { x: 150, y: 100 })`,
 * `atelier.store.getState().renameRoom("foyer", "Hall")`, `atelier.store.getState().reset()`.
 */

import { currentPeers } from "../../room/room.js";
import { useOwnStore } from "../own-store.js";
import { currentPlan } from "./plan.js";
import { useStore } from "../store.js";

if (import.meta.env.DEV) {
  Object.assign(globalThis, {
    atelier: { store: useStore, own: useOwnStore, plan: currentPlan, roomPeers: currentPeers },
  });
}
