import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { userDb } from "@/lib/server/user-db";
import { getHarness } from "@/lib/server/store";
import { buildInstallTree } from "@/lib/install";
import { KIND_LABEL, KIND_ORDER } from "@/lib/labels";
import type { PartKind, StoredPart } from "@/lib/harness";
import { CopyButton } from "@/components/copy-button";
import { BackIcon, ChevronIcon, KindIcon, Kicker, PencilIcon, RocketIcon, formatDate, pad2, plural } from "../ui";
import { EditForm } from "./edit-form";
import { DeleteZone } from "./delete-zone";

export const metadata = { title: "Harness · Hangar" };

/** Where each kind of part lands when the harness is installed. */
const INSTALLS_TO: Record<PartKind, string> = {
  rule: "AGENTS.md",
  skill: ".claude/skills/",
  agent: ".claude/agents/",
  mcp_server: ".mcp.json",
  permission: ".claude/settings.json",
  hook: ".claude/settings.json",
};

type Part<K extends PartKind> = Extract<StoredPart, { kind: K }>;

export default async function HarnessPage({ params }: PageProps<"/library/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db, userId } = await userDb();
  const h = await getHarness(userId, { id }, db);
  if (!h) notFound();

  const tree = buildInstallTree(h);
  const installCmd = `/mcp__hangar__install-harness ${/\s/.test(h.name) ? `"${h.name}"` : h.name}`;
  const byKind = <K extends PartKind>(k: K) => h.parts.filter((p): p is Part<K> => p.kind === k);
  const kinds = KIND_ORDER.filter((k) => byKind(k).length);
  const denyCount = byKind("permission").filter((p) => p.content.effect === "deny").length;
  const isComposed = h.source === "compose";

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-28 sm:px-8 sm:pb-28 sm:pt-32">
      <Link href="/library" className="ds-label inline-flex items-center gap-2 no-underline transition-colors hover:!text-ink">
        <BackIcon /> Library
      </Link>

      {/* ================= header + launch ================= */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,480px)] lg:items-start lg:gap-12">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-ds-md ${isComposed ? "text-white" : "border border-hairline bg-sunken text-ink-2"}`}
              style={isComposed ? { background: "var(--brand)" } : undefined}
            >
              <RocketIcon />
            </span>
            <span className={`ds-chip ${isComposed ? "ds-chip-brand" : ""}`}>{isComposed ? "Composed" : "Saved"}</span>
            <span className="ds-label">Updated {formatDate(h.updated_at)}</span>
          </div>
          <h1 className="ds-h1 mt-6 break-words">{h.name}</h1>
          {h.description ? (
            <p className="ds-lead mt-5 max-w-[56ch] !text-[clamp(17px,1.8vw,21px)]">{h.description}</p>
          ) : (
            <p className="ds-lead mt-5 !text-[clamp(17px,1.8vw,21px)] !text-ink-3">No description yet. Add one below.</p>
          )}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {kinds.map((k) => (
              <a key={k} href={`#${k}`} className="ds-chip no-underline transition-colors hover:border-hairline-2 hover:text-ink">
                {byKind(k).length} {byKind(k).length === 1 ? KIND_LABEL[k].one : KIND_LABEL[k].many.toLowerCase()}
              </a>
            ))}
            {denyCount > 0 && (
              <a href="#permission" className="ds-chip ds-chip-danger no-underline">
                {denyCount} deny
              </a>
            )}
          </div>
        </div>

        <section className="ds-glow relative overflow-hidden p-5 sm:p-7" style={{ boxShadow: "var(--shadow-pop)" }} aria-labelledby="launch-title">
          <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full opacity-30 blur-[70px]" style={{ background: "var(--brand)" }} aria-hidden />
          <div className="relative flex items-center gap-3">
            <span className="ds-pulse" aria-hidden />
            <span className="ds-label !text-accent">Ready to launch</span>
          </div>
          <h2 id="launch-title" className="ds-h3 relative mt-4">
            Launch it in a new folder
          </h2>
          <p className="ds-small relative mt-1.5">Open Claude Code in an empty folder and run:</p>
          <div className="relative mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <pre className="ds-code w-full min-w-0 flex-1 ![word-break:normal] [overflow-wrap:anywhere]">{installCmd}</pre>
            <CopyButton text={installCmd} />
          </div>
          {tree.envVars.length > 0 ? (
            <div className="relative mt-5">
              <p className="ds-label">Needs {plural(tree.envVars.length, "env var")}</p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {tree.envVars.map((v) => (
                  <li key={v} className="ds-chip ds-chip-accent font-[family-name:var(--font-code)] !text-[12px] !font-medium">
                    {v}
                  </li>
                ))}
              </ul>
              <p className="ds-small mt-2.5 !text-[13px]">Set them before restarting Claude Code. Values are never stored in Hangar.</p>
            </div>
          ) : (
            <p className="ds-small relative mt-5 !text-[13px]">No env vars needed.</p>
          )}
          <p className="ds-mono relative mt-5 border-t border-hairline pt-4 !text-[12px] text-ink-3">{tree.summary}</p>
        </section>
      </div>

      {/* ================= parts ================= */}
      {kinds.map((k, i) => (
        <PartSection key={k} id={k} n={pad2(i + 1)} kind={k} count={byKind(k).length}>
          {k === "rule" && <Rules parts={byKind("rule")} />}
          {k === "permission" && <Permissions parts={byKind("permission")} />}
          {k === "skill" && (
            <Expandables>
              {byKind("skill").map((p) => (
                <Expandable key={p.id} kind="skill" name={p.name} meta={plural(p.content.files.length, "file")}>
                  {p.content.files.map((f) => (
                    <div key={f.path}>
                      <p className="ds-label mb-2 !normal-case !tracking-normal">{f.path}</p>
                      <Code>{f.content}</Code>
                    </div>
                  ))}
                </Expandable>
              ))}
            </Expandables>
          )}
          {k === "agent" && (
            <Expandables>
              {byKind("agent").map((p) => (
                <Expandable key={p.id} kind="agent" name={p.name} meta={`${p.name}.md`}>
                  <Code>{p.content.content}</Code>
                </Expandable>
              ))}
            </Expandables>
          )}
          {k === "mcp_server" && (
            <Expandables>
              {byKind("mcp_server").map((p) => (
                <Expandable key={p.id} kind="mcp_server" name={p.name} meta={mcpMeta(p.content.config)}>
                  <Code>{JSON.stringify(p.content.config, null, 2)}</Code>
                </Expandable>
              ))}
            </Expandables>
          )}
          {k === "hook" && (
            <Expandables>
              {byKind("hook").map((p) => (
                <Expandable key={p.id} kind="hook" name={p.name} meta={`${p.content.event}${p.content.matcher ? ` · ${p.content.matcher}` : ""}`}>
                  <Code>{p.content.hooks.map((x) => x.command).join("\n")}</Code>
                  {(p.content.files ?? []).map((f) => (
                    <div key={f.path}>
                      <p className="ds-label mb-2 !normal-case !tracking-normal">.claude/hooks/{f.path}</p>
                      <Code>{f.content}</Code>
                    </div>
                  ))}
                </Expandable>
              ))}
            </Expandables>
          )}
        </PartSection>
      ))}

      {/* ================= manage ================= */}
      <section id="manage" className="scroll-mt-24 pt-16 sm:pt-24">
        <Kicker n={pad2(kinds.length + 1)}>Manage</Kicker>
        <h2 className="ds-h2 mt-4">Edit or delete</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="ds-glow p-6 sm:p-7">
            <div className="relative flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-ds-md border border-hairline bg-sunken text-ink-2">
                <PencilIcon />
              </span>
              <h3 className="ds-h3">Name and description</h3>
            </div>
            <div className="relative mt-6">
              <EditForm id={h.id} name={h.name} description={h.description} />
            </div>
          </div>
          <div
            className="flex flex-col gap-4 rounded-ds-lg border p-6 sm:p-7"
            style={{ borderColor: "color-mix(in oklab, var(--danger) 30%, transparent)", background: "color-mix(in oklab, var(--danger) 4%, var(--raised))" }}
          >
            <span className="ds-label !text-danger">Danger zone</span>
            <h3 className="ds-h3">Delete this harness</h3>
            <p className="ds-small">
              Removes it and all {plural(h.parts.length, "part")} from your library. This can&apos;t be undone. Harnesses composed from it keep their own copies.
            </p>
            <DeleteZone id={h.id} name={h.name} />
          </div>
        </div>
      </section>
    </main>
  );
}

function PartSection({ id, n, kind, count, children }: { id: string; n: string; kind: PartKind; count: number; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 pt-16 sm:pt-24">
      <Kicker n={n}>{INSTALLS_TO[kind]}</Kicker>
      <div className="mt-4 flex items-center gap-3">
        <h2 className="ds-h2">{KIND_LABEL[kind].many}</h2>
        <span className="ds-chip">{count}</span>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Rules({ parts }: { parts: Part<"rule">[] }) {
  const sections = new Map<string, Part<"rule">[]>();
  for (const p of parts) {
    const s = p.content.section?.trim() || "Rules";
    sections.set(s, [...(sections.get(s) ?? []), p]);
  }
  return (
    <div className="gap-4 md:columns-2">
      {[...sections].map(([section, rules]) => (
        <div key={section} className="ds-glow mb-4 break-inside-avoid p-5 sm:p-6">
          <div className="relative flex items-center justify-between gap-3">
            <h3 className="ds-h3 !text-[17px]">{section}</h3>
            <span className="ds-label">{pad2(rules.length)}</span>
          </div>
          <ul className="relative mt-4 space-y-3">
            {rules.map((r) => (
              <li key={r.id} className="flex items-start gap-3 text-[15px] leading-[1.55]">
                <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--brand)" }} aria-hidden />
                <span className="min-w-0 break-words">{r.content.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const EFFECT_ORDER = { deny: 0, ask: 1, allow: 2 } as const;
const EFFECT_CHIP = { deny: "ds-chip-danger", ask: "ds-chip-accent", allow: "" } as const;

function Permissions({ parts }: { parts: Part<"permission">[] }) {
  const sorted = [...parts].sort((a, b) => EFFECT_ORDER[a.content.effect] - EFFECT_ORDER[b.content.effect]);
  return (
    <div className="ds-glow overflow-hidden">
      <ul className="ds-divide relative">
        {sorted.map((p) => (
          <li key={p.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
            <span className={`ds-chip w-16 shrink-0 justify-center ${EFFECT_CHIP[p.content.effect]}`}>{p.content.effect}</span>
            <code className="ds-mono min-w-0 break-all text-ink">{p.content.rule}</code>
          </li>
        ))}
      </ul>
      <p className="relative border-t border-hairline px-5 py-3 text-[13px] text-ink-3 sm:px-6">Deny rules always carry over when you compose.</p>
    </div>
  );
}

function Expandables({ children }: { children: ReactNode }) {
  return (
    <div className="ds-glow overflow-hidden">
      <div className="ds-divide relative">{children}</div>
    </div>
  );
}

function Expandable({ kind, name, meta, children }: { kind: PartKind; name: string; meta: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition-colors hover:bg-sunken/60 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-ds-md border border-hairline bg-sunken text-ink-2 transition-colors group-open:text-accent">
          <KindIcon kind={kind} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{name}</span>
          <span className="ds-mono block truncate !text-[12px] text-ink-3">{meta}</span>
        </span>
        <ChevronIcon className="shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="flex flex-col gap-4 px-5 pb-5 sm:px-6">{children}</div>
    </details>
  );
}

function Code({ children }: { children: string }) {
  return <pre className="ds-code max-h-96 overflow-auto ![word-break:normal] [overflow-wrap:anywhere]">{children}</pre>;
}

function mcpMeta(config: Record<string, unknown>): string {
  if (typeof config.url === "string") return `${typeof config.type === "string" ? config.type : "http"} · ${config.url}`;
  if (typeof config.command === "string") return `stdio · ${[config.command, ...(Array.isArray(config.args) ? config.args : [])].join(" ")}`;
  return "MCP server";
}
