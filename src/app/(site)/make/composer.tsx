"use client";

import { useMemo, useState, useTransition } from "react";
import { compose } from "@/lib/compose";
import type { StoredPart } from "@/lib/harness";
import { KIND_LABEL, KIND_ORDER } from "@/lib/labels";
import { composeHarness } from "@/app/actions";

type H = { id: string; name: string; description: string | null };

const isDeny = (p: StoredPart) => p.kind === "permission" && p.content.effect === "deny";

function partTitle(p: StoredPart): string {
  if (p.kind === "rule") return p.content.text;
  if (p.kind === "permission") return `${p.content.effect} ${p.content.rule}`;
  if (p.kind === "hook") return `${p.name} · ${p.content.event}${p.content.matcher ? ` · ${p.content.matcher}` : ""}`;
  return p.name;
}

export function Composer({ harnesses, parts }: { harnesses: H[]; parts: StoredPart[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [used, setUsed] = useState<Set<string>>(new Set()); // harnesses opened as sources
  const [open, setOpen] = useState<string | null>(harnesses[0]?.id ?? null);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [replace, setReplace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const nameOf = useMemo(() => new Map(harnesses.map((h) => [h.id, h.name])), [harnesses]);
  const byHarness = useMemo(() => {
    const m = new Map<string, StoredPart[]>();
    for (const p of parts) m.set(p.harness_id, [...(m.get(p.harness_id) ?? []), p]);
    return m;
  }, [parts]);

  // A harness counts as a source once any of its parts is picked; its deny rules then come along.
  const sourceIds = useMemo(() => {
    const ids = new Set(used);
    for (const p of parts) if (selected.has(p.id)) ids.add(p.harness_id);
    return harnesses.map((h) => h.id).filter((id) => ids.has(id));
  }, [used, selected, parts, harnesses]);

  const sourceParts = useMemo(() => parts.filter((p) => sourceIds.includes(p.harness_id)), [parts, sourceIds]);
  const preview = useMemo(
    () => compose({ sourceParts, selectedPartIds: [...selected], resolutions }),
    [sourceParts, selected, resolutions],
  );
  // Display only: every conflict in the current selection, resolved or not, so a choice stays visible and can be changed.
  const allConflicts = useMemo(() => {
    const r = compose({ sourceParts, selectedPartIds: [...selected] });
    return r.ok ? [] : r.conflicts;
  }, [sourceParts, selected]);

  const toggle = (id: string, harnessId: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    // A harness stops being a source (and stops contributing deny rules) once none of its parts are picked.
    const stillUsed = (byHarness.get(harnessId) ?? []).some((p) => next.has(p.id));
    setUsed((u) => {
      const n = new Set(u);
      if (stillUsed) n.add(harnessId);
      else n.delete(harnessId);
      return n;
    });
  };

  const setAll = (harnessId: string, on: boolean) => {
    const ids = (byHarness.get(harnessId) ?? []).filter((p) => !isDeny(p)).map((p) => p.id);
    setSelected((s) => {
      const n = new Set(s);
      for (const id of ids) {
        if (on) n.add(id);
        else n.delete(id);
      }
      return n;
    });
    setUsed((u) => {
      const n = new Set(u);
      if (on) n.add(harnessId);
      else n.delete(harnessId);
      return n;
    });
  };

  const counts = preview.ok
    ? KIND_ORDER.map((k) => [k, preview.parts.filter((p) => p.kind === k).length] as const).filter(([, n]) => n)
    : [];

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await composeHarness({
        name,
        description,
        harnessIds: sourceIds,
        selectedPartIds: [...selected],
        resolutions,
        replace,
      });
      if (r?.error) setError(r.error);
    });
  };

  const total = preview.ok ? preview.parts.length : 0;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8">
      {/* ---------- source harnesses ---------- */}
      <section aria-label="Your harnesses" className="flex min-w-0 flex-col gap-3">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="ds-label">Sources · {harnesses.length}</span>
          <span className="ds-label hidden sm:inline">Pick parts to include</span>
        </div>
        {harnesses.map((h) => {
          const hp = byHarness.get(h.id) ?? [];
          const picked = hp.filter((p) => selected.has(p.id)).length;
          const isOpen = open === h.id;
          const isSource = sourceIds.includes(h.id);
          return (
            <div
              key={h.id}
              className={`ds-glow transition-shadow duration-200 ${isSource ? "shadow-[0_0_0_1px_var(--accent-line),var(--shadow-card)]" : ""}`}
            >
              <button
                type="button"
                className="relative flex w-full items-start gap-4 rounded-ds-lg px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-6 sm:py-5"
                onClick={() => setOpen(isOpen ? null : h.id)}
                aria-expanded={isOpen}
              >
                <span
                  className={`hidden h-10 w-10 shrink-0 place-items-center rounded-ds-md border sm:grid ${isSource ? "border-transparent text-white" : "border-hairline bg-sunken text-ink-2"}`}
                  style={isSource ? { background: "var(--brand)" } : undefined}
                >
                  <StackIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex min-h-10 items-center justify-between gap-3">
                    <span className="ds-h3 min-w-0 truncate">{h.name}</span>
                    <span className="flex shrink-0 items-center gap-2.5">
                      <span className={`ds-chip font-[family-name:var(--font-code)] !font-medium ${picked ? "ds-chip-accent" : ""}`}>
                        {picked}/{hp.length}
                      </span>
                      <span className={`text-ink-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        <ChevronIcon />
                      </span>
                    </span>
                  </span>
                  {h.description && <span className="ds-small line-clamp-2 !text-[14px] sm:pr-24">{h.description}</span>}
                </span>
              </button>
              {isOpen && (
                <div className="relative border-t border-hairline px-5 pb-6 pt-4 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="ds-label">{hp.length} parts</span>
                    <div className="flex gap-1.5">
                      <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setAll(h.id, true)}>
                        Select all
                      </button>
                      <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setAll(h.id, false)}>
                        Clear
                      </button>
                    </div>
                  </div>
                  {KIND_ORDER.map((k) => {
                    const kp = hp.filter((p) => p.kind === k);
                    if (!kp.length) return null;
                    return (
                      <fieldset key={k} className="mt-5 min-w-0">
                        <legend className="ds-label mb-2.5 flex items-center gap-2">
                          {KIND_LABEL[k].many}
                          <span className="text-ink-3/70">{kp.length}</span>
                        </legend>
                        <ul className="flex flex-col gap-1.5">
                          {kp.map((p) => {
                            const locked = isDeny(p);
                            const checked = locked ? sourceIds.includes(h.id) : selected.has(p.id);
                            return (
                              <li key={p.id}>
                                <label
                                  className={`flex items-start gap-3 rounded-ds-md border px-3.5 py-2.5 text-[15px] leading-snug transition-colors duration-150 ${
                                    locked
                                      ? "border-hairline bg-sunken/50 text-ink-2"
                                      : checked
                                        ? "cursor-pointer border-[var(--accent-line)] bg-accent-soft"
                                        : "cursor-pointer border-hairline hover:border-hairline-2 hover:bg-sunken"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="ds-check mt-[2px] shrink-0"
                                    checked={checked}
                                    disabled={locked}
                                    onChange={() => toggle(p.id, h.id)}
                                  />
                                  <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                                    <span className={`min-w-0 break-words ${p.kind === "rule" ? "" : "ds-mono !text-[13.5px] leading-[1.45]"}`}>
                                      {partTitle(p)}
                                    </span>
                                    {locked && <span className="ds-chip ds-chip-accent -my-0.5 shrink-0 !h-6 !text-[11.5px]">always included</span>}
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </fieldset>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ---------- summary ---------- */}
      <aside aria-label="New harness" className="ds-glow ds-noise relative overflow-hidden lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100svh-120px)] lg:flex-col">
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-56 w-72 rounded-full opacity-25 blur-[70px]"
          style={{ background: "var(--brand)" }}
          aria-hidden
        />
        <div className="relative flex min-h-0 flex-col gap-5 overflow-y-auto p-6 pb-6 sm:p-7 sm:pb-7">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <span className="ds-pulse" aria-hidden />
              <span className="ds-label !text-ink-2">New harness</span>
            </span>
            {total > 0 && <span className="ds-label">{total} parts</span>}
          </div>

          <label className="ds-field">
            <span>Name</span>
            <input className="ds-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Web class + lab" />
          </label>
          <label className="ds-field">
            <span>What it&apos;s for (optional)</span>
            <input className="ds-input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
          </label>

          <div className="border-t border-hairline pt-5">
            {selected.size === 0 ? (
              <p className="ds-small">Pick parts from your harnesses to see what the new one will contain.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {preview.ok ? (
                  <div>
                    <p className="ds-label mb-3">Contents</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {counts.map(([k, n]) => (
                        <li key={k} className="ds-chip">
                          <span className="text-ink">{n}</span> {n === 1 ? KIND_LABEL[k].one : KIND_LABEL[k].many.toLowerCase()}
                        </li>
                      ))}
                    </ul>
                    {preview.autoIncluded.length > 0 && (
                      <p className="mt-4 flex items-start gap-3 rounded-ds-md border border-[var(--accent-line)] bg-accent-soft px-3.5 py-3 text-[14px] leading-snug text-ink-2">
                        <span className="mt-px shrink-0 text-accent">
                          <ShieldIcon />
                        </span>
                        <span>
                          <span className="font-semibold text-ink">
                            {preview.autoIncluded.length} deny rule{preview.autoIncluded.length === 1 ? "" : "s"} added automatically
                          </span>{" "}
                          from your sources, so this harness is never less safe.
                        </span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="ds-small">The same part is picked from more than one harness. Choose one version of each to continue.</p>
                )}
                {allConflicts.length > 0 && (
                  <div className="flex flex-col gap-4 border-t border-hairline pt-5">
                    <p className="flex items-center justify-between gap-3 text-[14.5px] font-semibold">
                      <span className={`flex items-center gap-2 ${preview.ok ? "text-ink" : "text-accent"}`}>
                        <span className="ds-dot" aria-hidden />
                        Choose which to keep
                      </span>
                      <span className="ds-label shrink-0">
                        {allConflicts.length - (preview.ok ? 0 : preview.conflicts.length)}/{allConflicts.length} chosen
                      </span>
                    </p>
                    {allConflicts.map((c) => (
                      <fieldset key={c.key} className="min-w-0">
                        <legend className="mb-2 flex flex-wrap items-baseline gap-x-2">
                          <span className="ds-label">{KIND_LABEL[c.kind as keyof typeof KIND_LABEL].one}</span>
                          <span className="ds-mono break-all text-ink">{c.name}</span>
                        </legend>
                        <div className="flex flex-col gap-1.5">
                          {c.options.map((o) => {
                            const on = resolutions[c.key] === o.partId;
                            return (
                              <label
                                key={o.partId}
                                className={`flex cursor-pointer items-center gap-3 rounded-ds-md border px-3.5 py-2.5 text-[14.5px] transition-colors duration-150 ${
                                  on ? "border-[var(--accent-line)] bg-accent-soft text-ink" : "border-hairline text-ink-2 hover:border-hairline-2 hover:bg-sunken"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={c.key}
                                  className="ds-check shrink-0"
                                  checked={on}
                                  onChange={() => setResolutions((r) => ({ ...r, [c.key]: o.partId }))}
                                />
                                <span className="min-w-0 truncate">
                                  <span className="text-ink-3">from</span> <span className="font-semibold text-ink">{nameOf.get(o.harnessId)}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="relative flex flex-col gap-4 border-t border-hairline px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
          <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink-2">
            <input type="checkbox" className="ds-check" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            Replace a harness with the same name
          </label>
          {error && (
            <p role="alert" className="rounded-ds-md border border-danger/35 bg-danger/10 px-3.5 py-3 text-[14px] leading-snug text-danger">
              {error}
            </p>
          )}
          <button
            type="button"
            className="ds-btn ds-btn-brand ds-btn-lg w-full"
            disabled={pending || !preview.ok || selected.size === 0 || !name.trim()}
            onClick={submit}
          >
            {pending ? "Saving…" : "Save harness"}
          </button>
        </div>
      </aside>
    </div>
  );
}

const ic = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const StackIcon = () => (
  <svg {...ic}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);
const ChevronIcon = () => (
  <svg {...ic}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...ic} width={16} height={16}>
    <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
