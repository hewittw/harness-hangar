"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateToken, hashToken, tokenPrefix } from "@/lib/tokens";
import { userDb } from "@/lib/server/user-db";
import { composeAndSave } from "@/lib/server/store";

export async function createToken(label: string): Promise<{ token?: string; error?: string }> {
  const { db } = await userDb();
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
  const r = await composeAndSave(userId, { ...input, name, description: input.description?.trim() || undefined });
  if (!r.ok) {
    const message = r.message.includes("already exists") ? `You already have a harness named "${name}". Pick another name, or tick "Replace".` : r.message;
    return { error: message, conflicts: r.conflicts };
  }
  revalidatePath("/library");
  redirect(`/library/${r.value.id}`);
}
