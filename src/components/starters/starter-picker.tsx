"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loadStarterPack, type StarterResult } from "@/app/actions";

export type PackCard = {
  id: string;
  name: string;
  tagline: string;
  blurb: string;
  icon: "builder" | "design" | "family" | "student" | "founder";
  harnesses: { name: string; parts: number }[];
};

/**
 * Pick a starter library and load it into your account.
 * `next` is where the success state points (Library by default; Connect on the welcome page).
 */
export function StarterPicker({ packs, next = { href: "/library", label: "Open your library" } }: { packs: PackCard[]; next?: { href: string; label: string } }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, StarterResult>>({});
  const [, start] = useTransition();

  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {packs.map((p) => {
        const r = results[p.id];
        const done = r && !r.error;
        const busy = loading === p.id;
        return (
          <li key={p.id} className="flex">
            <div className={`ds-glow ds-lift relative flex w-full flex-col overflow-hidden p-6 ${done ? "!border-transparent" : ""}`}>
              {done && <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-[60px]" style={{ background: "var(--brand)" }} aria-hidden />}
              <div className="relative flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-ds-md text-white" style={{ background: "var(--brand)" }}>
                  <PackIcon icon={p.icon} />
                </span>
                <span className="ds-chip">{p.harnesses.length} harnesses</span>
              </div>
              <h3 className="ds-h3 relative mt-5">{p.name}</h3>
              <p className="ds-label relative mt-1 !tracking-[0.12em]">{p.tagline}</p>
              <p className="ds-small relative mt-3">{p.blurb}</p>
              <ul className="relative mt-4 space-y-1.5">
                {p.harnesses.map((h) => (
                  <li key={h.name} className="flex items-center justify-between gap-3 rounded-ds-sm border border-hairline bg-sunken/60 px-3 py-2 text-[14px]">
                    <span className="truncate">{h.name}</span>
                    <span className="ds-mono shrink-0 text-[12px] text-ink-3">{h.parts} parts</span>
                  </li>
                ))}
              </ul>

              <div className="relative mt-auto pt-5">
                {done ? (
                  <div className="flex flex-col gap-3">
                    <p className="flex items-center gap-2 text-[14px] text-ok">
                      <span className="ds-dot" />
                      {r.added.length ? `Added ${r.added.length} harness${r.added.length === 1 ? "" : "es"}` : "Already in your library"}
                      {r.skipped.length > 0 && r.added.length > 0 && <span className="text-ink-3"> · {r.skipped.length} already there</span>}
                    </p>
                    <Link href={next.href} className="ds-btn ds-btn-solid self-start">
                      {next.label} →
                    </Link>
                  </div>
                ) : (
                  <>
                    {r?.error && (
                      <p role="alert" className="mb-3 text-[14px] text-danger">
                        {r.error}
                      </p>
                    )}
                    <button
                      type="button"
                      className="ds-btn ds-btn-brand w-full"
                      disabled={loading !== null}
                      onClick={() => {
                        setLoading(p.id);
                        start(async () => {
                          const res = await loadStarterPack(p.id);
                          setResults((x) => ({ ...x, [p.id]: res }));
                          setLoading(null);
                        });
                      }}
                    >
                      {busy ? "Loading…" : `Load ${p.name}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const ic = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

function PackIcon({ icon }: { icon: PackCard["icon"] }) {
  switch (icon) {
    case "builder":
      return (
        <svg {...ic}>
          <path d="m16 18 6-6-6-6M8 6l-6 6 6 6M14 4l-4 16" />
        </svg>
      );
    case "design":
      return (
        <svg {...ic}>
          <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.4-.8 0-1.7.9-1.7H16a5 5 0 0 0 5-5c0-5-4-9.5-9-9.5Z" />
          <circle cx="7.5" cy="11" r="1" />
          <circle cx="10.5" cy="7" r="1" />
          <circle cx="15" cy="7.5" r="1" />
        </svg>
      );
    case "family":
      return (
        <svg {...ic}>
          <path d="M3 10.5 12 3l9 7.5V21H3z" />
          <path d="M12 17s-3.5-2-3.5-4.2A1.8 1.8 0 0 1 12 12a1.8 1.8 0 0 1 3.5.8C15.5 15 12 17 12 17Z" />
        </svg>
      );
    case "student":
      return (
        <svg {...ic}>
          <path d="m2 9 10-5 10 5-10 5L2 9Z" />
          <path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6" />
        </svg>
      );
    case "founder":
      return (
        <svg {...ic}>
          <path d="M3 20h18M5 20V10l7-6 7 6v10" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
  }
}
