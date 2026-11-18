import Link from "next/link";
import { userDb } from "@/lib/server/user-db";
import { listHarnesses } from "@/lib/server/store";
import { KIND_LABEL, KIND_ORDER } from "@/lib/labels";

export const metadata = { title: "Library · Hangar" };

export default async function LibraryPage() {
  const { db, userId } = await userDb();
  const harnesses = await listHarnesses(userId, db);

  return (
    <div className="py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            <span className="idx">●</span> Library
          </p>
          <h1 className="h-sec mt-3.5">Your harnesses</h1>
        </div>
        {harnesses.length >= 1 && (
          <Link href="/make" className="btn no-underline">
            Make a harness
          </Link>
        )}
      </div>

      {harnesses.length === 0 ? (
        <div className="card flex flex-col gap-4 p-8">
          <p className="h-card">No harnesses yet</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-[15px] text-dim">
            <li>
              <Link href="/connect" className="text-ign">
                Connect Claude Code
              </Link>{" "}
              (one command).
            </li>
            <li>
              Open Claude Code in a project whose setup you like, and run{" "}
              <code className="font-mono text-fg">/mcp__hangar__save-harness</code>.
            </li>
            <li>It shows up here as soon as it saves. Refresh this page.</li>
          </ol>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {harnesses.map((h) => (
            <li key={h.id}>
              <Link href={`/library/${h.id}`} className="card flex h-full flex-col gap-3 p-6 no-underline transition-colors hover:border-ign">
                <div className="flex items-start justify-between gap-3">
                  <span className="h-card">{h.name}</span>
                  <span className={`chip ${h.source === "compose" ? "chip-ign" : ""}`}>{h.source === "compose" ? "Composed" : "Saved"}</span>
                </div>
                {h.description && <p className="text-[14px] text-dim">{h.description}</p>}
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {KIND_ORDER.filter((k) => h.counts[k]).map((k) => (
                    <span key={k} className="chip">
                      {h.counts[k]} {h.counts[k] === 1 ? KIND_LABEL[k].one : KIND_LABEL[k].many.toLowerCase()}
                    </span>
                  ))}
                </div>
                <p className="font-mono text-[11px] text-faint">Updated {new Date(h.updated_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
