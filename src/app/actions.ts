"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateToken, hashToken, tokenPrefix } from "@/lib/tokens";
import { userDb } from "@/lib/server/user-db";
import { composeAndSave } from "@/lib/server/store";

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
    console.error("createToken", error);
    return { error: "Could not create a token. Try again." };
  }
  revalidatePath("/connect");
  return { token };
}

export async function revokeToken(formData: FormData) {
  const { db } = await userDb();
  const id = String(formData.get("id") ?? "");
  await db.from("api_tokens").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/connect");
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
