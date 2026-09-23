/**
 * ─ Code ─
 *
 * A viewing's code: eight letters and digits from an alphabet with no
 * look-alikes, forty bits from the browser's own randomness, short
 * enough to read out and long enough that two viewings never share
 * one. It never expires: a viewing's contents live in its members'
 * browsers, and the code is only how they find each other.
 * Decision: DECISIONS.md, a viewing is opt-in by link and siloed.
 */

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
