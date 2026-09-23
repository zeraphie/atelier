/**
 * ─ Hash ─
 *
 * A viewing lives in the address: `#viewing=<code>` joins it on load, and the
 * same link shared joins a peer to it. Pure: the code out of a hash, and
 * the hash for a code, so the URL is read and written in one place.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

const KEY = "viewing";

/** The viewing's code a location hash names, or none. */
export function viewingCodeFromHash(hash: string): string | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const code = params.get(KEY)?.trim();
  return code === undefined || code === "" ? undefined : code;
}

/** The location hash that names a viewing. */
export function hashForViewing(code: string): string {
  return `#${KEY}=${encodeURIComponent(code)}`;
}
