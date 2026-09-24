/** The key the gallery before viewings persisted under; a viewing's key is this with its code after a dot. */
export const GALLERY_KEY = "atelier.gallery";

/** The key a viewing's gallery persists under; the plain key for none. */
export function keyForViewing(code: string | undefined): string {
  return code === undefined ? GALLERY_KEY : `${GALLERY_KEY}.${code}`;
}
