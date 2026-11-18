import { useId } from "react";

/** The Hangar mark: a hangar outline with a gradient door, plus the expanded wordmark. */
export function Wordmark({ size = "md", showText = true }: { size?: "sm" | "md"; showText?: boolean }) {
  const id = useId();
  const px = size === "sm" ? 16 : 22;
  return (
    <span className={`flex items-center gap-2.5 ${size === "sm" ? "text-[13px]" : "text-[16px]"}`}>
      <svg width={px} height={px} viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--g1)" />
            <stop offset="0.5" stopColor="var(--g3)" />
            <stop offset="1" stopColor="var(--g4)" />
          </linearGradient>
        </defs>
        <path d="M2 21V10.2L12 3l10 7.2V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 21v-7h10v7" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
      {showText && <span className="ds-caps tracking-[0.18em]">Hangar</span>}
    </span>
  );
}
