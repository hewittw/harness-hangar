import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

/**
 * Service-role client. Bypasses RLS, so every query made with it MUST filter by
 * the authenticated user's id. Only used by the MCP route and trusted server code.
 */
export function admin(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new Error("Supabase server env vars are missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY).");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}
