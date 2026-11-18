"use client";

import { useState, useTransition } from "react";
import { createToken } from "@/app/actions";
import { CopyButton } from "@/components/copy-button";

export function TokenMaker({ mcpUrl }: { mcpUrl: string }) {
  const [label, setLabel] = useState("My laptop");
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
          <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm -ml-3 mt-5 !px-3" onClick={() => setToken(null)}>
            Done, make another
          </button>
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
          <span className="ds-chip">
            <span className="ds-dot text-ink-3" /> No token yet
          </span>
        </div>
        <h2 className="ds-h2 mt-5 !text-[clamp(24px,3vw,32px)]">Make a token</h2>
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
