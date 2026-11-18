"use client";

import { useSyncExternalStore } from "react";
import { ACCENT_KEY } from "./theme";

const ACCENTS = [
  { id: "ignition", label: "Ignition", swatch: "#e2551b" },
  { id: "blue", label: "Blue", swatch: "#0a84ff" },
  { id: "mono", label: "Mono", swatch: "linear-gradient(135deg,#1d1d1f 50%,#f5f5f7 50%)" },
] as const;

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accent"] });
  return () => obs.disconnect();
}

export function AccentPicker() {
  const current = useSyncExternalStore(subscribe, () => document.documentElement.dataset.accent ?? "ignition", () => "ignition");
  return (
    <div role="radiogroup" aria-label="Accent color" className="flex items-center gap-1 rounded-full border border-hairline p-1">
      {ACCENTS.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={current === a.id}
          onClick={() => {
            document.documentElement.dataset.accent = a.id;
            try {
              localStorage.setItem(ACCENT_KEY, a.id);
            } catch {}
          }}
          aria-label={a.label}
          className={`flex h-7 items-center gap-2 rounded-full px-2 text-[12.5px] font-medium transition-colors ${
            current === a.id ? "bg-sunken text-ink" : "text-ink-3 hover:text-ink"
          }`}
        >
          <span className="h-3 w-3 rounded-full border border-hairline-2" style={{ background: a.swatch }} />
          <span className="sr-only sm:not-sr-only">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
