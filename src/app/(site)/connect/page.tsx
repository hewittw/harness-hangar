import type { ReactNode } from "react";
import { userDb } from "@/lib/server/user-db";
import { siteUrl } from "@/lib/site";
import { revokeToken } from "@/app/actions";
import { TokenMaker } from "./token-maker";

export const metadata = { title: "Connect · Hangar" };

type TokenRow = { id: string; label: string; token_prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null };

// "Nov 18, 10:54 AM"; the year is added only when it isn't this year.
const when = (iso: string) => {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: sameYear ? undefined : "numeric", hour: "numeric", minute: "2-digit" });
};

const NEXT_STEPS: { cmd: string; text: ReactNode }[] = [
  { cmd: "/mcp", text: <>Check that <span className="font-semibold text-ink">hangar</span> says connected.</> },
  {
    cmd: '/mcp__hangar__install-harness "Product engineer"',
    text: "Try it now: in a new empty folder, install one of the basics already in your library.",
  },
  { cmd: "/mcp__hangar__save-harness", text: "In a project you like: save your own harness to your library." },
];

export default async function ConnectPage() {
  const { db } = await userDb();
  const { data, error } = await db
    .from("api_tokens")
    .select("id, label, token_prefix, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });
  if (error) console.error("connect: tokens query failed", error);
  const active = ((data ?? []) as TokenRow[]).filter((t) => !t.revoked_at);

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pt-32">
      {/* ================= header ================= */}
      <div className="flex items-center gap-3">
        <span className="ds-pulse" aria-hidden />
        <span className="ds-label !text-ink-2">Connect · MCP server</span>
      </div>
      <h1 className="ds-h1 mt-5">Connect Claude Code</h1>
      <p className="ds-lead mt-5 max-w-[60ch] !text-[clamp(17px,1.8vw,21px)]">
        One command adds Hangar as an MCP server for every folder on this computer (
        <code className="ds-mono whitespace-nowrap rounded-ds-sm border border-hairline bg-sunken px-1.5 py-0.5 !text-[0.8em] text-ink">--scope user</code>), so you can
        save from one project and install into another.
      </p>

      {/* ================= setup ================= */}
      <Section n="01" kicker="Setup">
        <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
          <TokenMaker mcpUrl={`${siteUrl()}/api/mcp`} />

          <div className="ds-card p-6 sm:p-7">
            <span className="ds-label">After you paste it</span>
            <h2 className="ds-h3 mt-4">Then in Claude Code</h2>
            <ol className="mt-5 space-y-4">
              {NEXT_STEPS.map((s, i) => (
                <li key={s.cmd} className="flex gap-3.5">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-[family-name:var(--font-code)] text-[11.5px] text-white"
                    style={{ background: "var(--brand)" }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[15px] text-ink-2">
                      Run <code className="ds-mono break-all font-medium text-ink">{s.cmd}</code>
                    </p>
                    <p className="ds-small mt-0.5">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="ds-small mt-6 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-5">
              Already had Claude Code open? Run <kbd className="ds-kbd">/exit</kbd> then <kbd className="ds-kbd">claude</kbd> so it loads hangar.
            </p>
          </div>
        </div>
      </Section>

      {/* ================= tokens ================= */}
      <Section
        n="02"
        kicker="Access"
        title="Your tokens"
        aside={!error && <span className="ds-chip">{active.length} active</span>}
      >
        {error ? (
          <div role="alert" className="flex flex-col gap-4 rounded-ds-lg border border-danger/35 bg-danger/[0.07] p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-danger/35 bg-danger/10 text-danger" aria-hidden>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v5M12 16.5h.01" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </span>
              <div>
                <p className="font-semibold text-danger">Your tokens couldn&apos;t be loaded</p>
                <p className="ds-small mt-1 max-w-[60ch]">
                  Something went wrong on our side while loading them, so this list can&apos;t be shown right now. Refresh the page to try again.
                </p>
              </div>
            </div>
            <a href="/connect" className="ds-btn ds-btn-glass ds-btn-sm self-start sm:self-center">
              Refresh
            </a>
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-ds-lg border border-dashed border-hairline-2 px-6 py-10 text-center">
            <p className="font-semibold">No active tokens yet</p>
            <p className="ds-small mt-1">Make one above. It appears here with when it was last used.</p>
          </div>
        ) : (
          <ul className="ds-card ds-divide overflow-hidden">
            {active.map((t) => (
              <li key={t.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-ds-md border border-hairline bg-sunken text-ink-2" aria-hidden>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="12" rx="2" />
                      <path d="M2 20h20" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{t.label}</p>
                    <p className="ds-mono mt-0.5 break-words !text-[12px] text-ink-3">
                      {t.token_prefix}… · made {when(t.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                  {t.last_used_at ? (
                    <span className="ds-chip ds-chip-ok">
                      <span className="ds-dot" /> Last used {when(t.last_used_at)}
                    </span>
                  ) : (
                    <span className="ds-chip">Never used</span>
                  )}
                  <form action={revokeToken}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="ds-btn ds-btn-danger ds-btn-sm" aria-label={`Revoke ${t.label}`}>
                      Revoke
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

function Section({ n, kicker, title, aside, children }: { n: string; kicker: string; title?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-14 sm:mt-20">
      <div className="flex items-center gap-3">
        <span className="ds-label !text-accent">{n}</span>
        <span className="h-px w-8 bg-hairline-2" />
        <span className="ds-label">{kicker}</span>
      </div>
      {title && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h2 className="ds-h2">{title}</h2>
          {aside}
        </div>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}
