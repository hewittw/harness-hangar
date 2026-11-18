import { createHash, randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** A new personal token. Shown to the user once; only its hash is stored. */
export function generateToken(): string {
  const bytes = randomBytes(32);
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `hk_${s}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** What the UI shows to identify a token: `hk_AbCd…`. */
export function tokenPrefix(token: string): string {
  return token.slice(0, 7);
}

export const looksLikeToken = (t: string) => /^hk_[A-Za-z0-9]{32}$/.test(t);
