import type { PartInput, StoredPart } from "./harness";

/**
 * Merge rules for "Make harness":
 * - Deny permissions from every source harness always come along. Safety only gets stricter.
 * - Everything else comes along only if selected.
 * - The same kind+name selected from two harnesses is a conflict unless the contents are identical,
 *   or one of them is a deny rule (the deny always wins),
 *   (then it is kept once) or the caller resolved it by naming the part to keep.
 */

export type ComposeRequest = {
  /** All parts of every source harness. */
  sourceParts: StoredPart[];
  /** Ids of the parts the user picked. */
  selectedPartIds: string[];
  /** For a conflict key `${kind}:${name}`, the id of the part to keep. */
  resolutions?: Record<string, string>;
};

export type Conflict = { key: string; kind: string; name: string; options: { partId: string; harnessId: string }[] };

export type ComposeResult =
  | { ok: true; parts: PartInput[]; autoIncluded: string[] }
  | { ok: false; conflicts: Conflict[]; unknownIds: string[] };

export const keyOf = (p: { kind: string; name: string }) => `${p.kind}:${p.name}`;

const isDeny = (p: StoredPart) => p.kind === "permission" && p.content.effect === "deny";

function strip(p: StoredPart): PartInput {
  return { kind: p.kind, name: p.name, content: p.content } as PartInput;
}

export function compose(req: ComposeRequest): ComposeResult {
  const byId = new Map(req.sourceParts.map((p) => [p.id, p]));
  const unknownIds = req.selectedPartIds.filter((id) => !byId.has(id));

  const selected = new Set(req.selectedPartIds.filter((id) => byId.has(id)));
  const autoIncluded: string[] = [];
  for (const p of req.sourceParts) {
    if (isDeny(p) && !selected.has(p.id)) {
      selected.add(p.id);
      autoIncluded.push(p.id);
    }
  }

  // Group selected parts by kind+name.
  const groups = new Map<string, StoredPart[]>();
  for (const id of selected) {
    const p = byId.get(id)!;
    const k = keyOf(p);
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }

  const chosenParts: StoredPart[] = [];
  const conflicts: Conflict[] = [];
  for (const [key, group] of groups) {
    const distinct = new Map<string, StoredPart>();
    for (const p of group) distinct.set(JSON.stringify(p.content), p);
    if (distinct.size === 1) {
      chosenParts.push(group[0]);
      continue;
    }
    // A deny rule never loses: if any version is a deny, the deny is kept and there is no choice to make.
    const deny = group.find(isDeny);
    if (deny) {
      chosenParts.push(deny);
      continue;
    }
    const chosenId = req.resolutions?.[key];
    const chosen = chosenId ? group.find((p) => p.id === chosenId) : undefined;
    if (chosen) {
      chosenParts.push(chosen);
    } else {
      conflicts.push({
        key,
        kind: group[0].kind,
        name: group[0].name,
        options: [...distinct.values()].map((p) => ({ partId: p.id, harnessId: p.harness_id })),
      });
    }
  }

  if (conflicts.length || unknownIds.length) return { ok: false, conflicts, unknownIds };

  // Keep the source order (harness by harness, part by part) within each kind.
  const order = ["rule", "permission", "skill", "agent", "mcp_server", "hook"];
  const sourceIndex = new Map(req.sourceParts.map((p, i) => [p.id, i]));
  chosenParts.sort(
    (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || sourceIndex.get(a.id)! - sourceIndex.get(b.id)!,
  );
  return { ok: true, parts: chosenParts.map(strip), autoIncluded };
}
