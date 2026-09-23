/**
 * ─ Textures ─
 *
 * Where a picture comes from: a gallery work's from the image set
 * served with the site, at one of its sizes; a picture of your own
 * from the derivative kept in the database, decoded once and shared
 * by every view that shows it.
 */

import { Assets, Texture } from "pixi.js";
import { getPicture } from "../storage/index.js";

/** Where a work's picture at one size is served from. */
export function imageUrl(id: string, px: number): string {
  return `${import.meta.env.BASE_URL}works/${id}-${px}.webp`;
}

/** Fetch and decode a work's picture at one size; the same URL is fetched once. */
export function loadPicture(id: string, px: number): Promise<Texture> {
  return Assets.load<Texture>(imageUrl(id, px));
}

const own = new Map<string, Promise<Texture>>();

/** Decode a picture of your own at one size from the database; the same picture is decoded once. */
export function loadOwnPicture(pictureId: string, px: number): Promise<Texture> {
  const key = `${pictureId}-${px}`;
  let pending = own.get(key);
  if (pending === undefined) {
    pending = getPicture(key).then(async (blob) => {
      if (blob === undefined) {
        throw new Error(`no picture kept under "${key}"`);
      }
      return Texture.from(await createImageBitmap(blob));
    });
    own.set(key, pending);
  }
  return pending;
}
