"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  return (
    <button
      type="button"
      className="ds-btn ds-btn-glass ds-btn-sm shrink-0"
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("done");
        } catch {
          // Clipboard access can be refused (permissions, insecure origin); the text is still on screen to select.
          setState("failed");
        }
        setTimeout(() => setState("idle"), 1400);
      }}
    >
      {state === "done" ? (
        <>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="text-ok" aria-hidden>
            <path d="m5 12 5 5 9-10" />
          </svg>
          Copied
        </>
      ) : state === "failed" ? (
        "Copy failed"
      ) : (
        label
      )}
    </button>
  );
}
