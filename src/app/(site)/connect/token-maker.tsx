"use client";

import { useState, useTransition } from "react";
import { createToken } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";

type Connected = { count: number; latestLabel: string; latestUsed: string | null };
const TRY_CMD = "/mcp__hangar__install-harness";

export function TokenMaker({ mcpUrl, connected }: { mcpUrl: string; connected: Connected | null }) {
  const [label, setLabel] = useState("My laptop");
  const [adding, setAdding] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const command = token
    ? `claude mcp add --transport http --scope user hangar ${mcpUrl} --header "Authorization: Bearer ${token}"`
    : "";

  if (token) {
    return (
      <div className="ds-glow p-6 sm:p-7">
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="ds-label">Connect · step 2 of 2</span>
            <span className="ds-chip ds-chip-ok">
              <span className="ds-dot" /> Token ready
            </span>
          </div>
          <h2 className="ds-h2 mt-5 !text-[clamp(24px,3vw,32px)]">Paste this into your terminal</h2>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <pre className="ds-code min-w-0 flex-1 [overflow-wrap:anywhere] [word-break:normal]">{command}</pre>
            <CopyButton text={command} label="Copy command" />
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-ds-md border border-hairline bg-sunken px-4 py-3">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0 text-accent" aria-hidden>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <p className="ds-small">
              <span className="font-semibold text-ink">Shown once.</span> Copy it now: Hangar stores only a hash of the token, so it can&apos;t show it
              again. Lost it? Revoke it below and make a new one.
            </p>
          </div>
          <button
            type="button"
            className="ds-btn ds-btn-solid mt-6"
            onClick={() => {
              setToken(null);
              setAdding(false);
            }}
          >
            I&apos;ve run it: done
          </button>
        </div>
      </div>
    );
  }

  if (connected && !adding) {
    const n = connected.count;
    return (
      <div className="ds-glow ds-noise relative overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-72 rounded-full opacity-25 blur-[70px]" style={{ background: "var(--brand)" }} aria-hidden />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="ds-label">Connect</span>
            <span className="ds-chip ds-chip-ok">
              <span className="ds-dot" /> Connected
            </span>
          </div>
          <h2 className="ds-h2 mt-5 !text-[clamp(24px,3vw,32px)]">Claude Code is connected</h2>
          <p className="ds-small mt-2 max-w-[52ch]">
            {n} active token{n === 1 ? "" : "s"}. Latest: <span className="font-semibold text-ink">{connected.latestLabel}</span>
            {connected.latestUsed ? (
              <>, last used {connected.latestUsed}.</>
            ) : (
              <>, not used yet. Run its command in your terminal, then type /mcp in Claude Code to check.</>
            )}
          </p>
          <div className="mt-6 rounded-ds-md border border-hairline bg-sunken/60 p-4">
            <p className="ds-label !text-accent">Try it now</p>
            <p className="ds-small mt-2">In a new, empty folder, start Claude Code and run this. Press Enter and Claude lists your harnesses.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
              <pre className="ds-code min-w-0 flex-1 !break-normal">{TRY_CMD}</pre>
              <CopyButton text={TRY_CMD} />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className="ds-btn ds-btn-glass" onClick={() => setAdding(true)}>
              + Add another computer
            </button>
            <span className="ds-small">Each computer gets its own token.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className="ds-glow p-6 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          try {
            const r = await createToken(label);
            if (r.token) setToken(r.token);
            else setError(r.error ?? "Something went wrong. Try again.");
          } catch {
            setError("Something went wrong. Check your connection and try again.");
          }
        });
      }}
    >
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="ds-label">Connect · step 1 of 2</span>
          {connected ? (
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setAdding(false)}>
              Cancel
            </button>
          ) : (
            <span className="ds-chip">
              <span className="ds-dot text-ink-3" /> No token yet
            </span>
          )}
        </div>
        <h2 className="ds-h2 mt-5 !text-[clamp(24px,3vw,32px)]">{connected ? "Add another computer" : "Make a token"}</h2>
        <p className="ds-small mt-2 max-w-[48ch]">
          Each computer gets its own token, so you can revoke one without touching the others.
        </p>
        <label className="ds-field mt-6 max-w-md">
          <span>Name it after the computer it&apos;s for</span>
          <input className="ds-input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="e.g. Work laptop" />
        </label>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-ds-md border border-danger/35 bg-danger/10 px-4 py-3 text-[14.5px] font-medium text-danger"
          >
            {error}
          </p>
        )}
        <button className="ds-btn ds-btn-brand mt-6 w-full sm:w-auto" disabled={pending}>
          {pending ? "Making token…" : "Make token and show command"}
        </button>
      </div>
    </form>
  );
}
