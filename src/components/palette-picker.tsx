"use client";

import { useSyncExternalStore } from "react";
import { PALETTE_KEY } from "./theme";

const PALETTES = [
  { id: "ignition", label: "Ignition", swatch: "linear-gradient(100deg,#ffb547,#ff5b1f,#ff2d87,#7a5cff)" },
  { id: "aurora", label: "Aurora", swatch: "linear-gradient(100deg,#43e8d8,#2bb8ff,#4f6bff,#9b5cff)" },
  { id: "mono", label: "Mono", swatch: "linear-gradient(100deg,#e9ecf4,#7d8597,#1e2230)" },
] as const;

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });
  return () => obs.disconnect();
}

export function PalettePicker() {
  const current = useSyncExternalStore(subscribe, () => document.documentElement.dataset.palette ?? "ignition", () => "ignition");
  return (
    <div role="radiogroup" aria-label="Color palette" className="ds-glass flex items-center gap-1 rounded-full border border-hairline p-1">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={current === p.id}
          onClick={() => {
            document.documentElement.dataset.palette = p.id;
            try {
              localStorage.setItem(PALETTE_KEY, p.id);
            } catch {}
          }}
          className={`flex h-7 items-center gap-2 rounded-full px-2.5 text-[12.5px] font-semibold transition-colors ${
            current === p.id ? "bg-sunken text-ink" : "text-ink-3 hover:text-ink"
          }`}
        >
          <span className="h-3 w-5 rounded-full" style={{ background: p.swatch }} />
          {p.label}
        </button>
      ))}
    </div>
  );
}
