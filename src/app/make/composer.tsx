"use client";

import { useMemo, useState, useTransition } from "react";
import { compose } from "@/lib/compose";
import type { StoredPart } from "@/lib/harness";
import { KIND_LABEL, KIND_ORDER } from "@/lib/labels";
import { composeHarness } from "../actions";

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

  const toggle = (id: string, harnessId: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
    setUsed((u) => new Set(u).add(harnessId));
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

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        {harnesses.map((h) => {
          const hp = byHarness.get(h.id) ?? [];
          const picked = hp.filter((p) => selected.has(p.id)).length;
          const isOpen = open === h.id;
          return (
            <div key={h.id} className={`card ${sourceIds.includes(h.id) ? "border-ign" : ""}`}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                onClick={() => setOpen(isOpen ? null : h.id)}
                aria-expanded={isOpen}
              >
                <span>
                  <span className="h-card">{h.name}</span>
                  {h.description && <span className="mt-1 block text-[13px] text-dim">{h.description}</span>}
                </span>
                <span className="font-mono text-[11px] text-dim">
                  {picked}/{hp.length} {isOpen ? "▴" : "▾"}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-line px-5 pb-5 pt-3">
                  <div className="mb-3 flex gap-2">
                    <button type="button" className="btn btn-ghost !px-3 !py-1.5" onClick={() => setAll(h.id, true)}>
                      Select all
                    </button>
                    <button type="button" className="btn btn-ghost !px-3 !py-1.5" onClick={() => setAll(h.id, false)}>
                      Clear
                    </button>
                  </div>
                  {KIND_ORDER.map((k) => {
                    const kp = hp.filter((p) => p.kind === k);
                    if (!kp.length) return null;
                    return (
                      <fieldset key={k} className="mt-4">
                        <legend className="label mb-2">{KIND_LABEL[k].many}</legend>
                        <ul className="flex flex-col gap-1.5">
                          {kp.map((p) => {
                            const locked = isDeny(p);
                            const checked = locked ? sourceIds.includes(h.id) : selected.has(p.id);
                            return (
                              <li key={p.id}>
                                <label className={`flex items-start gap-2.5 text-[14px] ${locked ? "text-dim" : "cursor-pointer"}`}>
                                  <input
                                    type="checkbox"
                                    className="mt-1 accent-[var(--ign)]"
                                    checked={checked}
                                    disabled={locked}
                                    onChange={() => toggle(p.id, h.id)}
                                  />
                                  <span className={p.kind === "permission" || p.kind === "skill" || p.kind === "agent" || p.kind === "mcp_server" || p.kind === "hook" ? "font-mono text-[13px]" : ""}>
                                    {partTitle(p)}
                                    {locked && <span className="chip chip-ign ml-2 align-middle">always included</span>}
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
      </div>

      <aside className="card sticky top-[76px] flex flex-col gap-4 p-6">
        <p className="label !text-ign">New harness</p>
        <label className="flex flex-col gap-1.5 text-[14px]">
          <span className="text-dim">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Web class + lab" />
        </label>
        <label className="flex flex-col gap-1.5 text-[14px]">
          <span className="text-dim">What it&apos;s for (optional)</span>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>

        <div className="border-t border-line pt-4">
          {selected.size === 0 ? (
            <p className="text-[14px] text-dim">Pick parts on the left.</p>
          ) : preview.ok ? (
            <>
              <ul className="flex flex-wrap gap-1.5">
                {counts.map(([k, n]) => (
                  <li key={k} className="chip">
                    {n} {n === 1 ? KIND_LABEL[k].one : KIND_LABEL[k].many.toLowerCase()}
                  </li>
                ))}
              </ul>
              {preview.autoIncluded.length > 0 && (
                <p className="mt-3 text-[13px] text-dim">
                  Includes {preview.autoIncluded.length} deny rule{preview.autoIncluded.length === 1 ? "" : "s"} from your sources automatically.
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] text-ign">Choose which version to keep:</p>
              {preview.conflicts.map((c) => (
                <fieldset key={c.key}>
                  <legend className="mb-1.5 font-mono text-[13px]">
                    {KIND_LABEL[c.kind as keyof typeof KIND_LABEL].one} “{c.name}”
                  </legend>
                  {c.options.map((o) => (
                    <label key={o.partId} className="flex cursor-pointer items-center gap-2 text-[14px]">
                      <input
                        type="radio"
                        name={c.key}
                        className="accent-[var(--ign)]"
                        checked={resolutions[c.key] === o.partId}
                        onChange={() => setResolutions((r) => ({ ...r, [c.key]: o.partId }))}
                      />
                      from {nameOf.get(o.harnessId)}
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-[13px] text-dim">
          <input type="checkbox" className="accent-[var(--ign)]" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          Replace a harness with the same name
        </label>
        {error && <p className="text-[14px] text-ign">{error}</p>}
        <button type="button" className="btn" disabled={pending || !preview.ok || selected.size === 0 || !name.trim()} onClick={submit}>
          {pending ? "Saving…" : "Save harness"}
        </button>
      </aside>
    </div>
  );
}
