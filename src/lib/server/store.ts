import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { admin } from "./admin";
import { hashToken, looksLikeToken } from "../tokens";
import { LIMITS, type HarnessInput, type PartInput, type PartKind, type StoredPart } from "../harness";
import { formatFindings, scanParts } from "../scan";
import { compose, keyOf } from "../compose";

/**
 * Data access for trusted server code (MCP route, server actions).
 * Uses the service-role client, so EVERY query filters by userId.
 */

export type HarnessSummary = {
  id: string;
  name: string;
  description: string | null;
  source: "upload" | "compose";
  updated_at: string;
  counts: Record<PartKind, number>;
};

export type HarnessDetail = Omit<HarnessSummary, "counts"> & { parts: StoredPart[] };

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

const emptyCounts = (): Record<PartKind, number> => ({ rule: 0, skill: 0, agent: 0, mcp_server: 0, permission: 0, hook: 0 });

/** Returns the Clerk user id for a valid, unrevoked token. */
export async function authenticateToken(token: string): Promise<{ userId: string; tokenId: string } | null> {
  if (!looksLikeToken(token)) return null;
  const { data, error } = await admin()
    .from("api_tokens")
    .select("id, user_id")
    .eq("token_hash", hashToken(token))
    .is("revoked_at", null)
    .maybeSingle();
  if (error || !data) return null;
  // Best effort; never block a request on this.
  void admin().from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {});
  return { userId: data.user_id, tokenId: data.id };
}

export async function saveHarness(
  userId: string,
  input: HarnessInput,
  opts: { replace?: boolean; source?: "upload" | "compose"; composedFrom?: string[] } = {},
): Promise<Result<{ id: string; replaced: boolean }>> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const p of input.parts) {
    const k = keyOf(p);
    if (seen.has(k)) dupes.add(k);
    seen.add(k);
  }
  if (dupes.size) {
    return {
      ok: false,
      message: `Two parts share the same kind and name: ${[...dupes].join(", ")}. Give each part a unique name within its kind (for rules, use a short slug of the rule), then call again. Nothing was saved.`,
    };
  }

  const bytes = Buffer.byteLength(JSON.stringify(input.parts));
  if (bytes > LIMITS.maxTotalBytes) {
    return {
      ok: false,
      message: `The harness is ${Math.round(bytes / 1000)} KB; the limit is ${LIMITS.maxTotalBytes / 1000} KB. Leave out large non-essential files (images, generated data, vendored code) and call again. Nothing was saved.`,
    };
  }

  const findings = scanParts(input.parts);
  if (findings.length) return { ok: false, message: formatFindings(findings) };

  const existing = await findHarnessId(userId, input.name);
  const { data, error } = await admin().rpc("save_harness", {
    p_user_id: userId,
    p_name: input.name,
    p_description: input.description ?? null,
    p_source: opts.source ?? "upload",
    p_composed_from: opts.composedFrom ?? [],
    p_parts: input.parts,
    p_replace: opts.replace ?? false,
  });
  if (error) {
    if (error.message.includes("HARNESS_EXISTS")) {
      return {
        ok: false,
        message: `A harness named "${input.name}" already exists. Ask the user whether to replace it (call again with replace: true) or save under a different name. Nothing was saved.`,
      };
    }
    console.error("save_harness rpc failed", error);
    return { ok: false, message: "The database rejected the save. Nothing was saved. Try again; if it keeps failing, tell the user." };
  }
  return { ok: true, value: { id: data as string, replaced: Boolean(existing) } };
}

async function findHarnessId(userId: string, name: string): Promise<string | null> {
  const { data } = await admin().from("harnesses").select("id").eq("user_id", userId).eq("name", name).maybeSingle();
  return data?.id ?? null;
}

export async function listHarnesses(userId: string, db: SupabaseClient = admin()): Promise<HarnessSummary[]> {
  const { data, error } = await db
    .from("harnesses")
    .select("id, name, description, source, updated_at, harness_parts(kind)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((h) => {
    const counts = emptyCounts();
    for (const p of (h.harness_parts as { kind: PartKind }[]) ?? []) counts[p.kind]++;
    return { id: h.id, name: h.name, description: h.description, source: h.source, updated_at: h.updated_at, counts };
  });
}

export async function getHarness(
  userId: string,
  by: { name: string } | { id: string },
  db: SupabaseClient = admin(),
): Promise<HarnessDetail | null> {
  let q = db.from("harnesses").select("id, name, description, source, updated_at").eq("user_id", userId);
  q = "id" in by ? q.eq("id", by.id) : q.eq("name", by.name);
  const { data: h, error } = await q.maybeSingle();
  if (error || !h) return null;
  const parts = await loadParts(userId, [h.id], db);
  return { ...h, parts };
}

export async function loadParts(userId: string, harnessIds: string[], db: SupabaseClient = admin()): Promise<StoredPart[]> {
  if (!harnessIds.length) return [];
  const { data, error } = await db
    .from("harness_parts")
    .select("id, harness_id, kind, name, content, position")
    .eq("user_id", userId)
    .in("harness_id", harnessIds)
    .order("position", { ascending: true });
  if (error) throw error;
  // Keep harness order as given.
  const rank = new Map(harnessIds.map((id, i) => [id, i]));
  return ((data ?? []) as StoredPart[]).sort(
    (a, b) => rank.get(a.harness_id)! - rank.get(b.harness_id)! || (a.position ?? 0) - (b.position ?? 0),
  );
}

export async function deleteHarness(userId: string, id: string): Promise<boolean> {
  const { error, count } = await admin().from("harnesses").delete({ count: "exact" }).eq("user_id", userId).eq("id", id);
  return !error && (count ?? 0) > 0;
}

/** Compose by ids (website) and save the result. */
export async function composeAndSave(
  userId: string,
  req: { name: string; description?: string; harnessIds: string[]; selectedPartIds: string[]; resolutions?: Record<string, string>; replace?: boolean },
): Promise<Result<{ id: string; autoIncluded: number; parts: PartInput[] }> & { conflicts?: ReturnType<typeof conflictList> }> {
  const sourceParts = await loadParts(userId, req.harnessIds);
  const r = compose({ sourceParts, selectedPartIds: req.selectedPartIds, resolutions: req.resolutions });
  if (!r.ok) {
    if (r.unknownIds.length) return { ok: false, message: `Unknown part ids: ${r.unknownIds.join(", ")}.` };
    return { ok: false, message: describeConflicts(r.conflicts), conflicts: conflictList(r.conflicts) };
  }
  if (!r.parts.length) return { ok: false, message: "Pick at least one part." };
  const saved = await saveHarness(
    userId,
    { name: req.name, description: req.description, parts: r.parts },
    { replace: req.replace, source: "compose", composedFrom: req.harnessIds },
  );
  if (!saved.ok) return saved;
  return { ok: true, value: { id: saved.value.id, autoIncluded: r.autoIncluded.length, parts: r.parts } };
}

function conflictList(conflicts: { key: string; options: { partId: string; harnessId: string }[] }[]) {
  return conflicts.map((c) => ({
    key: c.key,
    partIds: c.options.map((o) => o.partId),
    harnessIds: c.options.map((o) => o.harnessId),
  }));
}

function describeConflicts(conflicts: { key: string }[]): string {
  return `These parts exist in more than one source harness with different contents: ${conflicts
    .map((c) => c.key)
    .join(", ")}. Choose which version to keep for each.`;
}
