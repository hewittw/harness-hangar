import Link from "next/link";
import { notFound } from "next/navigation";
import { userDb } from "@/lib/server/user-db";
import { getHarness } from "@/lib/server/store";
import { buildInstallTree } from "@/lib/install";
import { KIND_LABEL, KIND_ORDER } from "@/lib/labels";
import type { StoredPart } from "@/lib/harness";
import { CopyButton } from "@/components/copy-button";
import { deleteHarness } from "../../actions";

export default async function HarnessPage({ params }: PageProps<"/library/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { db, userId } = await userDb();
  const h = await getHarness(userId, { id }, db);
  if (!h) notFound();

  const tree = buildInstallTree(h);
  const installCmd = `/mcp__hangar__install-harness ${/\s/.test(h.name) ? `"${h.name}"` : h.name}`;
  const byKind = (k: StoredPart["kind"]) => h.parts.filter((p) => p.kind === k);

  return (
    <div className="py-14">
      <Link href="/library" className="label no-underline hover:text-fg">
        ← Library
      </Link>
      <div className="mb-3 mt-5 flex flex-wrap items-center gap-3">
        <h1 className="h-sec">{h.name}</h1>
        <span className={`chip ${h.source === "compose" ? "chip-ign" : ""}`}>{h.source === "compose" ? "Composed" : "Saved"}</span>
      </div>
      {h.description && <p className="lede">{h.description}</p>}
      <p className="mt-2 font-mono text-[12px] text-dim">{tree.summary}</p>

      <section className="card mt-8 flex flex-col gap-3 p-6">
        <p className="label !text-ign">Launch it in a new folder</p>
        <p className="text-[14px] text-dim">Open Claude Code in an empty folder and run:</p>
        <div className="flex flex-wrap items-center gap-3">
          <pre className="code flex-1">{installCmd}</pre>
          <CopyButton text={installCmd} />
        </div>
        {tree.envVars.length > 0 && (
          <p className="text-[13.5px] text-dim">
            Needs these env vars: {tree.envVars.map((v) => <code key={v} className="mr-2 font-mono text-fg">{v}</code>)}
          </p>
        )}
      </section>

      {KIND_ORDER.map((k) => {
        const parts = byKind(k);
        if (!parts.length) return null;
        return (
          <section key={k} className="mt-10">
            <h2 className="label mb-3">
              {KIND_LABEL[k].many} · {parts.length}
            </h2>
            {k === "rule" ? <Rules parts={parts} /> : (
              <ul className="card divide-y divide-line">
                {parts.map((p) => (
                  <li key={p.id}>
                    <PartRow part={p} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <section className="mt-14 border-t border-line pt-6">
        <form action={deleteHarness}>
          <input type="hidden" name="id" value={h.id} />
          <button className="btn btn-danger">Delete this harness</button>
        </form>
      </section>
    </div>
  );
}

function Rules({ parts }: { parts: StoredPart[] }) {
  const sections = new Map<string, StoredPart[]>();
  for (const p of parts) {
    if (p.kind !== "rule") continue;
    const s = p.content.section?.trim() || "Rules";
    sections.set(s, [...(sections.get(s) ?? []), p]);
  }
  return (
    <div className="card divide-y divide-line">
      {[...sections].map(([section, rules]) => (
        <div key={section} className="px-5 py-4">
          <p className="h-card mb-2 !text-[15px]">{section}</p>
          <ul className="list-disc space-y-1 pl-5 text-[14.5px]">
            {rules.map((r) => r.kind === "rule" && <li key={r.id}>{r.content.text}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PartRow({ part }: { part: StoredPart }) {
  switch (part.kind) {
    case "permission":
      return (
        <div className="flex items-center gap-3 px-5 py-3">
          <span className={`chip ${part.content.effect === "deny" ? "chip-ign" : ""}`}>{part.content.effect}</span>
          <code className="font-mono text-[13px]">{part.content.rule}</code>
        </div>
      );
    case "skill":
      return (
        <details className="group px-5 py-3">
          <summary className="flex cursor-pointer items-center justify-between gap-3">
            <span className="font-semibold">{part.name}</span>
            <span className="font-mono text-[11px] text-dim">{part.content.files.length} file{part.content.files.length === 1 ? "" : "s"}</span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {part.content.files.map((f) => (
              <div key={f.path}>
                <p className="mb-1 font-mono text-[11px] text-dim">{f.path}</p>
                <pre className="code max-h-80 overflow-y-auto">{f.content}</pre>
              </div>
            ))}
          </div>
        </details>
      );
    case "agent":
      return (
        <details className="px-5 py-3">
          <summary className="cursor-pointer font-semibold">{part.name}</summary>
          <pre className="code mt-3 max-h-80 overflow-y-auto">{part.content.content}</pre>
        </details>
      );
    case "mcp_server":
      return (
        <details className="px-5 py-3">
          <summary className="cursor-pointer font-semibold">{part.name}</summary>
          <pre className="code mt-3">{JSON.stringify(part.content.config, null, 2)}</pre>
        </details>
      );
    case "hook":
      return (
        <details className="px-5 py-3">
          <summary className="cursor-pointer">
            <span className="font-semibold">{part.name}</span>{" "}
            <span className="font-mono text-[12px] text-dim">
              {part.content.event}
              {part.content.matcher ? ` · ${part.content.matcher}` : ""}
            </span>
          </summary>
          <pre className="code mt-3">{part.content.hooks.map((x) => x.command).join("\n")}</pre>
        </details>
      );
    default:
      return null;
  }
}
