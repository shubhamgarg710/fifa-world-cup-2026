/**
 * League code + display-name normalization.
 *
 * Codes are 6 chars from an unambiguous alphabet (no 0/O, 1/I/L) so they can
 * be read aloud, typed on a phone, and screenshotted without confusion.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // excludes 0 O 1 I L
export const CODE_LENGTH = 6;

export function generateCode(rand: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  }
  return out;
}

/** Trim + uppercase. Input formatting never blocks a valid join. */
export function normalizeCode(s: string): string {
  return s.trim().toUpperCase();
}

/** True if every char is in the unambiguous alphabet and length is exact. */
export function isWellFormedCode(s: string): boolean {
  const c = normalizeCode(s);
  return c.length === CODE_LENGTH && [...c].every((ch) => ALPHABET.includes(ch));
}

/** Trim ends and collapse internal whitespace runs to single spaces. */
export function normalizeName(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}
