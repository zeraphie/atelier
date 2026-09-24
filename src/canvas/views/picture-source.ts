/**
 * ─ Picture source ─
 *
 * Where a work's picture comes from, and what is known of it before it
 * loads. A gallery work has its entry in images.json and its sizes in
 * the site's image set; a picture of your own has its record in the
 * collection and its one derivative in the database. A view asks by
 * pixel size and is handed a texture.
 * Decision: DECISIONS.md, a picture and its hanging are two things.
 */

import type { Texture } from "pixi.js";
import type { ImageEntry } from "../../gallery/tiers.js";
import type { Work } from "../../gallery/works.js";
import { DERIVATIVE_PX } from "../../pictures/prepare.js";
import type { PictureRecord } from "../../state/slices/collection.js";
import { loadOwnPicture, loadPicture } from "../theme/textures.js";

/** Where a view gets its picture at a size: the site's image set, or a picture of your own. */
export type PictureSource = (px: number) => Promise<Texture>;

/** What images.json says of a gallery work, or what the collection says of a picture of your own; none for a picture not here. */
export function entryFor(
  work: Work,
  images: Readonly<Record<string, ImageEntry>>,
  pictures: Readonly<Record<string, PictureRecord>>
): ImageEntry | undefined {
  if (work.pictureId === undefined) {
    return images[work.id];
  }
  const record = pictures[work.pictureId];
  if (record === undefined) {
    return undefined;
  }
  const { width, height } = record.size;
  return { color: record.color, width, height, sizes: [{ px: DERIVATIVE_PX, width, height }] };
}

/** The site's image set for a gallery work; the database for a picture of your own. */
export function sourceFor(work: Work): PictureSource {
  const { pictureId } = work;
  return pictureId === undefined
    ? (px) => loadPicture(work.id, px)
    : (px) => loadOwnPicture(pictureId, px);
}
