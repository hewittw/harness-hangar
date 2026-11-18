"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateToken, hashToken, tokenPrefix } from "@/lib/tokens";
import { userDb } from "@/lib/server/user-db";
import { composeAndSave, saveHarness, updateHarness } from "@/lib/server/store";
import { getStarterPack } from "@/lib/starters";
import { updateHarnessInput } from "@/lib/manage";

const MAX_ACTIVE_TOKENS = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createToken(label: string): Promise<{ token?: string; error?: string }> {
  const { db } = await userDb();
  const { count } = await db.from("api_tokens").select("id", { count: "exact", head: true }).is("revoked_at", null);
  if ((count ?? 0) >= MAX_ACTIVE_TOKENS) return { error: `You have ${MAX_ACTIVE_TOKENS} active tokens. Revoke one first.` };
  const token = generateToken();
  const clean = label.trim().slice(0, 60) || "Claude Code";
  const { error } = await db.from("api_tokens").insert({ label: clean, token_hash: hashToken(token), token_prefix: tokenPrefix(token) });
  if (error) {
    // The database enforces the cap too (trigger), in case two requests race past the count above.
    if (error.message.includes("TOKEN_LIMIT")) return { error: `You have ${MAX_ACTIVE_TOKENS} active tokens. Revoke one first.` };
    console.error("createToken", error);
    return { error: "Could not create a token. Try again." };
  }
  revalidatePath("/connect");
  revalidatePath("/"); // landing buttons depend on having an active token
  return { token };
}

export async function revokeToken(formData: FormData) {
  const { db } = await userDb();
  const id = String(formData.get("id") ?? "");
  await db.from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/connect");
  revalidatePath("/"); // landing buttons depend on having an active token
}

export async function deleteHarness(formData: FormData) {
  const { db } = await userDb();
  const id = String(formData.get("id") ?? "");
  await db.from("harnesses").delete().eq("id", id);
  revalidatePath("/library");
  redirect("/library");
}

export type ComposeState = { error?: string; conflicts?: { key: string; partIds: string[] }[] };

export async function composeHarness(input: {
  name: string;
  description?: string;
  harnessIds: string[];
  selectedPartIds: string[];
  resolutions: Record<string, string>;
  replace?: boolean;
}): Promise<ComposeState> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in again." };
  const name = input.name.trim();
  if (!name) return { error: "Give the new harness a name." };
  const ids = [...input.harnessIds, ...input.selectedPartIds, ...Object.values(input.resolutions)];
  if (!ids.every((id) => UUID.test(id))) return { error: "That selection isn't valid. Reload the page and try again." };
  let r: Awaited<ReturnType<typeof composeAndSave>>;
  try {
    r = await composeAndSave(userId, { ...input, name, description: input.description?.trim() || undefined });
  } catch (e) {
    console.error("composeHarness", e);
    return { error: "Hangar hit a database error. Nothing was saved. Try again in a minute." };
  }
  if (!r.ok) {
    const message = r.message.includes("already exists") ? `You already have a harness named "${name}". Pick another name, or tick "Replace".` : r.message;
    return { error: message, conflicts: r.conflicts };
  }
  revalidatePath("/library");
  redirect(`/library/${r.value.id}`);
}

export type HarnessDetailsState = { ok?: boolean; error?: string; findings?: string[]; savedAt?: number };

/**
 * Rename a harness and/or change its description from the website. Goes through updateHarness, so the
 * leak scan and the unique-name rule are the same as for the MCP update_harness tool.
 */
export async function updateHarnessDetails(_prev: HarnessDetailsState, formData: FormData): Promise<HarnessDetailsState> {
  const { userId } = await auth();
  if (!userId) return { error: "Sign in again." };
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!UUID.test(id)) return { error: "That harness isn't valid. Reload the page and try again." };
  if (!name) return { error: "Give the harness a name." };

  try {
    const current = await getHarnessMeta(userId, id);
    if (!current) return { error: "This harness no longer exists. Go back to your library." };
    const input = updateHarnessInput.safeParse({
      name: current.name,
      new_name: name !== current.name ? name : undefined,
      description: description !== (current.description ?? "") ? description : undefined,
    });
    if (!input.success) {
      const field = input.error.issues[0]?.path[0];
      return { error: field === "description" ? "Keep the description under 500 characters." : "Keep the name under 80 characters." };
    }
    if (input.data.new_name === undefined && input.data.description === undefined) return { error: "Nothing changed." };

    const r = await updateHarness(userId, input.data);
    if (!r.ok) {
      if (r.message.startsWith("Update rejected: the leak scan")) {
        return {
          error: "The leak scan flagged the new details, so nothing was changed. Remove personal details (emails, home-folder paths) and any keys, then save again:",
          // Finding lines read "- description: GitHub token. <fix for the model>"; show where and what, never the value.
          findings: r.message
            .split("\n")
            .filter((l) => l.startsWith("- "))
            .map((l) => {
              const [where, rest = ""] = l.slice(2).split(": ", 2);
              return `${where.charAt(0).toUpperCase()}${where.slice(1)}: ${rest.split(". ")[0].replace(/\.$/, "")}`;
            }),
        };
      }
      if (r.message.includes("already has a harness named")) return { error: `You already have a harness named "${name}". Pick another name.` };
      if (r.message.startsWith("No harness named")) return { error: "This harness no longer exists. Go back to your library." };
      return { error: r.message };
    }
  } catch (e) {
    console.error("updateHarnessDetails", e);
    return { error: "Hangar hit a database error. Nothing was changed. Try again in a minute." };
  }
  revalidatePath("/library");
  revalidatePath(`/library/${id}`);
  return { ok: true, savedAt: Date.now() };
}

/** Current name and description of one of the user's harnesses (RLS read, also filtered by user). */
async function getHarnessMeta(userId: string, id: string): Promise<{ name: string; description: string | null } | null> {
  const { db } = await userDb();
  const { data, error } = await db.from("harnesses").select("name, description").eq("user_id", userId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------------- starter packs ---------------- */

export type StarterResult = { added: string[]; skipped: string[]; error?: string };

/**
 * Loads a starter library into the signed-in user's account. Each harness goes through saveHarness,
 * so it gets the same validation, leak scan, quotas and rate limits as a real upload.
 * Harnesses the user already has (same name) are skipped, so loading twice is harmless.
 */
export async function loadStarterPack(packId: string): Promise<StarterResult> {
  const { userId } = await auth();
  const added: string[] = [];
  const skipped: string[] = [];
  if (!userId) return { added, skipped, error: "Sign in again." };
  const pack = getStarterPack(packId);
  if (!pack) return { added, skipped, error: "That starter pack doesn't exist." };

  for (const h of pack.harnesses) {
    let r: Awaited<ReturnType<typeof saveHarness>>;
    try {
      r = await saveHarness(userId, h, { source: "upload" });
    } catch (e) {
      console.error("loadStarterPack", e);
      return { added, skipped, error: "Hangar hit a database error. Try again in a minute." };
    }
    if (r.ok) {
      added.push(h.name);
      continue;
    }
    if (r.message.includes("already exists")) {
      skipped.push(h.name);
      continue;
    }
    const m = r.message.toLowerCase();
    const error = m.includes("library is full")
      ? "Your library is full. Delete a harness, then load the pack again."
      : m.includes("per hour") || m.includes("rate") || m.includes("try again")
        ? "You've hit the hourly save limit. Try again later."
        : m.includes("mb")
          ? "Your library is out of storage space. Delete a harness, then try again."
          : "This pack couldn't be loaded.";
    if (added.length) revalidatePath("/library");
    return { added, skipped, error };
  }
  revalidatePath("/library");
  return { added, skipped };
}
