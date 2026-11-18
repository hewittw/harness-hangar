import { createClerkClient } from "@clerk/backend";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { APIRequestContext, APIResponse } from "@playwright/test";
import { env } from "./env";

/** Returns the Clerk user id for a test email, creating the user if it does not exist yet. */
export async function ensureClerkUser(email: string): Promise<string> {
  const clerk = createClerkClient({ secretKey: env("CLERK_SECRET_KEY") });
  const { data } = await clerk.users.getUserList({ emailAddress: [email] });
  const found = data.find((u) => u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email.toLowerCase()));
  if (found) return found.id;
  const created = await clerk.users.createUser({ emailAddress: [email], skipPasswordRequirement: true });
  return created.id;
}

const noSession = { persistSession: false, autoRefreshToken: false };

/** Service-role client: bypasses RLS. Test setup and cleanup only. */
export function serviceClient(): SupabaseClient {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), { auth: noSession });
}

/** Client acting as a Clerk user, built the same way as src/lib/server/user-db.ts. RLS applies. */
export function clerkUserClient(getToken: () => Promise<string | null>): SupabaseClient {
  return createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), {
    accessToken: getToken,
    auth: noSession,
  });
}

type JsonRpcMessage = { jsonrpc: "2.0"; id?: number | string | null; result?: unknown; error?: { code: number; message: string } };

/** Reads a JSON-RPC reply from a Streamable HTTP response, which may be plain JSON or SSE-framed. */
export async function readJsonRpc(res: APIResponse, id: number): Promise<JsonRpcMessage> {
  const body = await res.text();
  const type = res.headers()["content-type"] ?? "";
  const messages: JsonRpcMessage[] = [];
  if (type.includes("text/event-stream")) {
    for (const event of body.split(/\r?\n\r?\n/)) {
      const data = event
        .split(/\r?\n/)
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trimStart())
        .join("\n");
      if (data) messages.push(JSON.parse(data));
    }
  } else {
    const parsed = JSON.parse(body);
    messages.push(...(Array.isArray(parsed) ? parsed : [parsed]));
  }
  const reply = messages.find((m) => m.id === id);
  if (!reply) throw new Error(`No JSON-RPC reply with id ${id} in: ${body.slice(0, 500)}`);
  return reply;
}

/** A minimal MCP client over Streamable HTTP: initialize, then call tools. */
export async function mcpSession(request: APIRequestContext, token: string) {
  let nextId = 1;
  const session: { id?: string } = {};
  const headers = () => ({
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
    Authorization: `Bearer ${token}`,
    ...(session.id ? { "mcp-session-id": session.id } : {}),
  });

  const post = (data: unknown) => request.post("/api/mcp", { headers: headers(), data });

  const initId = nextId++;
  const initRes = await post({
    jsonrpc: "2.0",
    id: initId,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "hangar-e2e", version: "0.0.0" } },
  });
  if (initRes.status() !== 200) throw new Error(`initialize returned ${initRes.status()}: ${await initRes.text()}`);
  session.id = initRes.headers()["mcp-session-id"];
  const init = await readJsonRpc(initRes, initId);
  if (init.error) throw new Error(`initialize failed: ${init.error.message}`);
  await post({ jsonrpc: "2.0", method: "notifications/initialized" });

  return {
    init,
    async callTool(name: string, args: Record<string, unknown> = {}) {
      const id = nextId++;
      const res = await post({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } });
      return { status: res.status(), reply: await readJsonRpc(res, id) };
    },
  };
}
