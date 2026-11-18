import { userDb } from "@/lib/server/user-db";
import { siteUrl } from "@/lib/site";
import { revokeToken } from "../actions";
import { TokenMaker } from "./token-maker";

export const metadata = { title: "Connect · Hangar" };

type TokenRow = { id: string; label: string; token_prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null };

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "never");

export default async function ConnectPage() {
  const { db } = await userDb();
  const { data } = await db
    .from("api_tokens")
    .select("id, label, token_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });
  const tokens = (data ?? []) as TokenRow[];
  const active = tokens.filter((t) => !t.revoked_at);

  return (
    <div className="py-14">
      <p className="eyebrow">
        <span className="idx">●</span> Connect
      </p>
      <h1 className="h-sec mb-4 mt-3.5">Connect Claude Code</h1>
      <p className="lede mb-8">
        One command adds Hangar as an MCP server for every folder on this computer (<code className="font-mono">--scope user</code>), so
        you can save from one project and install into another.
      </p>

      <TokenMaker mcpUrl={`${siteUrl()}/api/mcp`} />

      <h2 className="label mb-3 mt-12">Your tokens</h2>
      {active.length === 0 ? (
        <p className="text-[14px] text-dim">No active tokens yet.</p>
      ) : (
        <ul className="card divide-y divide-line">
          {active.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold">{t.label}</p>
                <p className="font-mono text-[12px] text-dim">
                  {t.token_prefix}… · made {when(t.created_at)} · last used {when(t.last_used_at)}
                </p>
              </div>
              <form action={revokeToken}>
                <input type="hidden" name="id" value={t.id} />
                <button className="btn btn-danger !py-2">Revoke</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
