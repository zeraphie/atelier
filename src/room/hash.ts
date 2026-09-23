/**
 * ─ Hash ─
 *
 * A room lives in the address: `#room=<id>` joins it on load, and the
 * same link shared joins a peer to it. Pure: the id out of a hash, and
 * the hash for an id, so the URL is read and written in one place.
 * Decision: DECISIONS.md, a room is opt-in by link and siloed.
 */

const KEY = "room";

/** The room id a location hash names, or none. */
export function roomIdFromHash(hash: string): string | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const id = params.get(KEY)?.trim();
  return id === undefined || id === "" ? undefined : id;
}

/** The location hash that names a room. */
export function hashForRoom(id: string): string {
  return `#${KEY}=${encodeURIComponent(id)}`;
}
