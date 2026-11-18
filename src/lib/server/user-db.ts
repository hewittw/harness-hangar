import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client acting as the signed-in Clerk user. RLS applies.
 * Use this for everything the website reads and for simple writes.
 * This is also the auth check for signed-in pages: signed-out visitors are sent to sign-in.
 */
export async function userDb(): Promise<{ db: SupabaseClient; userId: string }> {
  const { userId, getToken, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    accessToken: async () => (await getToken()) ?? null,
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { db, userId };
}
