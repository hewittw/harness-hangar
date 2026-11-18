import { STARTER_PACKS } from "./index";
import type { PackCard } from "@/components/starters/starter-picker";

/** The small, serializable view of each pack that the picker needs (no file contents sent to the browser). */
export function starterCards(): PackCard[] {
  return STARTER_PACKS.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    blurb: p.blurb,
    icon: p.icon,
    harnesses: p.harnesses.map((h) => ({ name: h.name, parts: h.parts.length })),
  }));
}
