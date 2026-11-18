import type { StarterPack } from "./types";

// Filled in by the per-pack files (builder.ts, design.ts, family.ts, student.ts, founder.ts).
export const STARTER_PACKS: StarterPack[] = [];

export function getStarterPack(id: string): StarterPack | undefined {
  return STARTER_PACKS.find((p) => p.id === id);
}

export type { StarterPack } from "./types";
