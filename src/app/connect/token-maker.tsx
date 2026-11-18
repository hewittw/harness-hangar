"use client";

import { useState, useTransition } from "react";
import { createToken } from "../actions";
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
      <div className="card flex flex-col gap-4 p-6">
        <p className="label !text-ign">Step 2 · paste this into your terminal</p>
        <pre className="code">{command}</pre>
        <div className="flex flex-wrap items-center gap-3">
          <CopyButton text={command} label="Copy command" />
          <span className="text-[13.5px] text-dim">
            This is the only time the token is shown. Hangar stores only a hash of it.
          </span>
        </div>
        <div className="border-t border-line pt-4 text-[14px] text-dim">
          <p className="mb-2 font-semibold text-fg">Then, in Claude Code:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code className="font-mono">/mcp</code> and check <b>hangar</b> says connected.
            </li>
            <li>
              In a project you like, run <code className="font-mono">/mcp__hangar__save-harness</code>.
            </li>
            <li>
              In a new empty folder, run <code className="font-mono">/mcp__hangar__install-harness</code>.
            </li>
          </ol>
        </div>
        <button type="button" className="btn btn-ghost self-start" onClick={() => setToken(null)}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form
      className="card flex flex-col gap-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await createToken(label);
          if (r.token) setToken(r.token);
          else setError(r.error ?? "Something went wrong.");
        });
      }}
    >
      <p className="label !text-ign">Step 1 · make a token</p>
      <label className="flex flex-col gap-2 text-[14px]">
        <span className="text-dim">Name it after the computer it&apos;s for</span>
        <input className="input max-w-sm" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} />
      </label>
      {error && <p className="text-[14px] text-ign">{error}</p>}
      <button className="btn self-start" disabled={pending}>
        {pending ? "Making token…" : "Make token and show command"}
      </button>
    </form>
  );
}
