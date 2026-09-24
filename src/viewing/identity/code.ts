/**
 * ─ Code ─
 *
 * A viewing's code: eight letters and digits from an alphabet with no
 * look-alikes, forty bits from the browser's own randomness, short
 * enough to read out and long enough that two viewings never share
 * one. It never expires: a viewing's contents live in its members'
 * browsers, and the code is only how they find each other.
 * Decision: DECISIONS.md, everyone is in a viewing.
 */

import { latestFirst } from "../../state/utils/stamped.js";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const CODE_LENGTH = 8;

/** A new code, from the browser's randomness. */
export function newViewingCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

/** Whether `code` is one this gallery could have made. */
export function isViewingCode(code: string): boolean {
  return code.length === CODE_LENGTH && [...code].every((char) => ALPHABET.includes(char));
}

/**
 * The code to offer on arrival: the one in the address, else the viewing
 * this browser calls home, else the one it was in last, else a new one,
 * which is then its home.
 */
export function suggestedCode(
  fromAddress: string | undefined,
  home: string | undefined,
  visited: Readonly<Record<string, { readonly at: number }>>,
  make: () => string = newViewingCode
): { readonly code: string; readonly isNew: boolean } {
  if (fromAddress !== undefined) {
    return { code: fromAddress, isNew: false };
  }
  if (home !== undefined) {
    return { code: home, isNew: false };
  }
  const last = latestFirst(visited)[0];
  return last === undefined ? { code: make(), isNew: true } : { code: last, isNew: false };
}
