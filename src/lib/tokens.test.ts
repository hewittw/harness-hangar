import { describe, expect, it } from "vitest";
import { generateToken, hashToken, looksLikeToken, tokenPrefix } from "./tokens";

describe("tokens", () => {
  it("generates distinct well-formed tokens", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(looksLikeToken(a)).toBe(true);
    expect(tokenPrefix(a)).toBe(a.slice(0, 7));
  });
  it("hashes deterministically and never returns the token", () => {
    const t = generateToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t.slice(3));
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
  });
});
