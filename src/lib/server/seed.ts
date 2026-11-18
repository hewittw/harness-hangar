import "server-only";
import { admin } from "./admin";
import { saveHarness } from "./store";
import { STARTER_PACKS } from "../starters";
import type { HarnessInput } from "../harness";

/** The harnesses every new account starts with: one per kind of user, so anyone can try an install right away. */
export const BASICS: readonly (readonly [packId: string, harnessName: string])[] = [
  ["builder", "Product engineer"],
  ["design", "Landing page studio"],
  ["family", "Family calendar & school"],
  ["student", "Research papers"],
];

export function basicHarnesses(): HarnessInput[] {
  return BASICS.flatMap(([packId, name]) => {
    const h = STARTER_PACKS.find((p) => p.id === packId)?.harnesses.find((x) => x.name === name);
    return h ? [h] : [];
  });
}

/**
 * Gives an account the basics the first time we see it (website or MCP). Runs once per user:
 * the user_flags row is claimed first, so concurrent requests can't double-seed, and deleted
 * basics never come back. Never throws: a failed seed must not break the page or tool call.
 */
export async function ensureSeeded(userId: string): Promise<void> {
  const basics = basicHarnesses();
  if (!basics.length) return;
  try {
    const { error } = await admin().from("user_flags").insert({ user_id: userId });
    if (error) {
      if (error.code !== "23505") console.error("seed flag failed", error); // 23505 = already seeded
      return;
    }
    for (const h of basics) {
      const r = await saveHarness(userId, h, { source: "upload" });
      if (!r.ok && !r.message.includes("already exists")) console.error("seed save failed", h.name, r.message.slice(0, 120));
    }
  } catch (e) {
    console.error("seed failed", e);
  }
}
