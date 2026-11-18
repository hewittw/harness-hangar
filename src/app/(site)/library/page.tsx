import Link from "next/link";
import { userDb } from "@/lib/server/user-db";
import { listHarnesses, type HarnessSummary } from "@/lib/server/store";
import { KIND_LABEL, KIND_ORDER } from "@/lib/labels";
import { CopyButton } from "@/components/copy-button";
import { ArrowIcon, Kicker, PlusIcon, RocketIcon, formatDate, pad2 } from "./ui";

import { starterCards } from "@/lib/starters/cards";
import { ensureSeeded } from "@/lib/server/seed";
import { StarterPicker } from "@/components/starters/starter-picker";

export const metadata = { title: "Library · Hangar" };

const SAVE_CMD = "/mcp__hangar__save-harness";

export default async function LibraryPage() {
  const { db, userId } = await userDb();
  await ensureSeeded(userId);
  const harnesses = await listHarnesses(userId, db);

  // Deny rules per harness, for the card chips and the telemetry row. Best effort: on error the chips are left out.
  const denyBy = new Map<string, number>();
  if (harnesses.length) {
    const { data } = await db
      .from("harness_parts")
      .select("harness_id, effect:content->>effect")
      .eq("user_id", userId)
      .eq("kind", "permission");
    for (const p of (data ?? []) as { harness_id: string; effect: string | null }[]) {
      if (p.effect === "deny") denyBy.set(p.harness_id, (denyBy.get(p.harness_id) ?? 0) + 1);
    }
  }

  const totalParts = harnesses.reduce((n, h) => n + KIND_ORDER.reduce((m, k) => m + h.counts[k], 0), 0);
  const totalDeny = [...denyBy.values()].reduce((a, b) => a + b, 0);
  const composed = harnesses.filter((h) => h.source === "compose").length;

  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pb-28 sm:pt-32">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker n="01">Library</Kicker>
          <h1 className="ds-h1 mt-5">Your harnesses</h1>
          <p className="ds-lead mt-4 max-w-[52ch] !text-[clamp(17px,1.8vw,21px)]">
            Everything you saved from Claude Code or composed here. Open one to launch it in a new folder.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3 self-start sm:self-auto">
          <Link href="/library/starters" className="ds-btn ds-btn-glass ds-btn-lg">
            Starter packs
          </Link>
          {harnesses.length > 0 && (
            <Link href="/make" className="ds-btn ds-btn-brand ds-btn-lg">
              <PlusIcon /> Make a harness
            </Link>
          )}
        </div>
      </header>

      {harnesses.length === 0 ? (
        <>
          <EmptyState />
          <section className="mt-16">
            <div className="flex items-center gap-3">
              <span className="ds-label !text-accent">Or</span>
              <span className="h-px w-8 bg-hairline-2" />
              <span className="ds-label">Starter libraries</span>
            </div>
            <h2 className="ds-h2 mt-4">Start with a ready-made library</h2>
            <p className="ds-small mt-2 max-w-[60ch]">Load three example harnesses for the kind of work you do, then explore, compose and install them.</p>
            <div className="mt-8">
              <StarterPicker packs={starterCards()} />
            </div>
          </section>
        </>
      ) : (
        <>
          <dl className="ds-glass mt-10 grid grid-cols-2 gap-x-6 rounded-ds-lg border border-hairline px-5 sm:px-6 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-hairline">
            {[
              ["Harnesses", pad2(harnesses.length)],
              ["Parts", pad2(totalParts)],
              ["Deny rules", pad2(totalDeny)],
              ["Composed", pad2(composed)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 py-4 lg:px-6 lg:first:pl-0 lg:last:pr-0">
                <dt className="ds-label">{k}</dt>
                <dd className="ds-mono text-[14px] text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {harnesses.map((h) => (
              <li key={h.id} className="flex">
                <HarnessCard h={h} deny={denyBy.get(h.id) ?? 0} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function HarnessCard({ h, deny }: { h: HarnessSummary; deny: number }) {
  const isComposed = h.source === "compose";
  return (
    <Link
      href={`/library/${h.id}`}
      className="ds-glow ds-lift group flex w-full flex-col gap-3 p-6 text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div className="relative flex items-start justify-between gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-ds-md ${isComposed ? "text-white" : "border border-hairline bg-sunken text-ink-2"}`}
          style={isComposed ? { background: "var(--brand)" } : undefined}
        >
          <RocketIcon />
        </span>
        <span className={`ds-chip ${isComposed ? "ds-chip-brand" : ""}`}>{isComposed ? "Composed" : "Saved"}</span>
      </div>
      <h2 className="ds-h3 relative mt-2 break-words">{h.name}</h2>
      {h.description ? (
        <p className="ds-small relative line-clamp-3">{h.description}</p>
      ) : (
        <p className="ds-small relative !text-ink-3">No description.</p>
      )}
      <div className="relative mt-auto flex flex-wrap gap-1.5 pt-3">
        {KIND_ORDER.filter((k) => h.counts[k]).map((k) => (
          <span key={k} className="ds-chip">
            {h.counts[k]} {h.counts[k] === 1 ? KIND_LABEL[k].one : KIND_LABEL[k].many.toLowerCase()}
          </span>
        ))}
        {deny > 0 && <span className="ds-chip ds-chip-danger">{deny} deny</span>}
      </div>
      <div className="relative mt-1 flex items-center justify-between border-t border-hairline pt-4">
        <span className="ds-label">Updated {formatDate(h.updated_at)}</span>
        <ArrowIcon className="text-ink-3 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" />
      </div>
    </Link>
  );
}

function EmptyState() {
  const steps = [
    {
      t: "Connect Claude Code",
      d: (
        <>
          One command adds Hangar to Claude Code for every folder.{" "}
          <Link href="/connect" className="font-semibold text-accent underline-offset-4 hover:underline">
            Get the command
          </Link>
          .
        </>
      ),
    },
    {
      t: "Save a harness",
      d: (
        <>
          Open Claude Code in a project whose setup you like and run:
          <span className="mt-3 flex flex-col items-start gap-2 sm:flex-row">
            <code className="ds-code w-full min-w-0 flex-1 !break-normal">{SAVE_CMD}</code>
            <CopyButton text={SAVE_CMD} />
          </span>
        </>
      ),
    },
    { t: "See it here", d: "It shows up in this library as soon as it saves. Refresh the page." },
  ];
  return (
    <section className="ds-glow ds-noise relative mt-10 overflow-hidden !rounded-ds-xl px-6 py-12 sm:px-12 sm:py-16">
      <div className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full opacity-35 blur-[90px]" style={{ background: "var(--brand)" }} aria-hidden />
      <div className="relative grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <span className="grid h-12 w-12 place-items-center rounded-ds-md text-white" style={{ background: "var(--brand)" }}>
            <RocketIcon />
          </span>
          <h2 className="ds-h2 mt-6">Your hangar is empty</h2>
          <p className="ds-lead mt-3 max-w-[40ch] !text-[18px]">
            Save the setup you already use in Claude Code: rules, skills, MCP servers, deny rules and hooks. It takes about a minute.
          </p>
          <Link href="/connect" className="ds-btn ds-btn-brand ds-btn-lg mt-8">
            Connect Claude Code <ArrowIcon />
          </Link>
        </div>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-ds-lg border border-hairline bg-canvas/60 p-5">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-[family-name:var(--font-code)] text-[12px] text-white"
                style={{ background: "var(--brand)" }}
              >
                0{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.t}</p>
                <div className="ds-small mt-1">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
