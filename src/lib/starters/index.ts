import { builderPack } from "./builder";
import { designPack } from "./design";
import { familyPack } from "./family";
import { founderPack } from "./founder";
import { studentPack } from "./student";
import type { StarterPack } from "./types";

export const STARTER_PACKS: StarterPack[] = [builderPack, designPack, familyPack, studentPack, founderPack];

export function getStarterPack(id: string): StarterPack | undefined {
  return STARTER_PACKS.find((p) => p.id === id);
}

export type { StarterPack } from "./types";
