/**
 * ─ Arrival ─
 *
 * Coming in: the card under the mark asks which viewing, what name and
 * which colour, and the curtain waits for the answer. The code offered
 * is the address's, else this browser's home, else where it was last,
 * else a new one, which becomes its home and starts from the gallery
 * this browser had before viewings, if it had one. Come in keeps the
 * name and colour, puts the code in the address and joins; the curtain
 * rises once the viewing's saved state is in.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { useOwnStore } from "../../state/own-store.js";
import { GALLERY_KEY, keyForViewing } from "../../state/store.js";
import { stateStorage } from "../../storage/index.js";
import { suggestedCode } from "./code.js";
import { hashForViewing, viewingCodeFromHash } from "./hash.js";
import { joinViewing } from "../viewing.js";

let cameIn: () => void = () => {};
const arrival = new Promise<void>((resolve) => {
  cameIn = resolve;
});

/** Resolves once the person has come in and their viewing's saved state is switched to. */
export function whenArrived(): Promise<void> {
  return arrival;
}

/** The code the card offers, and whether it was made just now. */
export function offeredCode(): { readonly code: string; readonly isNew: boolean } {
  const { home, viewings } = useOwnStore.getState();
  return suggestedCode(viewingCodeFromHash(window.location.hash), home, viewings);
}

/**
 * Come in: keep the name and colour, make this the home viewing if there is
 * none yet, put the code in the address and join it. Resolves with the
 * viewing's saved state in place.
 */
export async function arrive(code: string, name: string, color: string): Promise<void> {
  const own = useOwnStore.getState();
  own.setName(name);
  own.setColor(color);
  if (own.home === undefined) {
    await adoptSoloGallery(code);
    useOwnStore.getState().setHome(code);
  }
  if (viewingCodeFromHash(window.location.hash) !== code) {
    window.location.hash = hashForViewing(code);
  }
  await joinViewing(code);
  cameIn();
}

// A gallery kept before there were viewings becomes the first viewing's,
// so nothing made alone is lost; a viewing already saved is left as it is.
async function adoptSoloGallery(code: string): Promise<void> {
  const solo = await stateStorage.getItem(GALLERY_KEY);
  const key = keyForViewing(code);
  if (solo !== null && (await stateStorage.getItem(key)) === null) {
    await stateStorage.setItem(key, solo);
  }
}
