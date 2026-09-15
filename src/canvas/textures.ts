import { Assets, type Texture } from "pixi.js";

/** Where a work's picture at one size is served from. */
export function imageUrl(id: string, px: number): string {
  return `${import.meta.env.BASE_URL}works/${id}-${px}.webp`;
}

/** Fetch and decode a work's picture at one size; the same URL is fetched once. */
export function loadPicture(id: string, px: number): Promise<Texture> {
  return Assets.load<Texture>(imageUrl(id, px));
}
