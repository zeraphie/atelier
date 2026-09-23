import { Hydration } from "./hydration.js";

export { deletePicture, getPicture, putPicture, stateStorage } from "./db.js";
export { Hydration } from "./hydration.js";
export type { Timer } from "./hydration.js";

// Long enough for a slow disk, short enough that a database that never
// answers does not keep the curtain down.
const HYDRATION_DEADLINE_MS = 5000;

/** The roll call every persisted store joins at creation. */
export const hydration = new Hydration(HYDRATION_DEADLINE_MS);

/** Resolves once every persisted store has loaded, or given up. */
export function whenHydrated(): Promise<void> {
  return hydration.whenDone();
}
