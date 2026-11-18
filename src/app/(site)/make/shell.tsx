import type { ReactNode } from "react";

/** Page header for /make, shared with the loading skeleton so the layout doesn't jump. */
export function MakeShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pb-28 sm:pt-32">
      <div
        className="pointer-events-none absolute -top-10 right-0 h-72 w-[520px] max-w-full rounded-full opacity-20 blur-[100px]"
        style={{ background: "var(--brand)" }}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="ds-label !text-accent">01</span>
          <span className="h-px w-8 bg-hairline-2" />
          <span className="ds-label">Make harness</span>
        </div>
        <h1 className="ds-h1 mt-5 max-w-[20ch]">Compose a new harness</h1>
        <p className="ds-lead mt-5 max-w-[60ch] !text-[clamp(17px,1.8vw,21px)]">
          Pick parts from any of your harnesses. Every deny rule from a harness you use comes along automatically, so a new
          harness is never less safe than the ones it came from.
        </p>
      </div>
      <div className="relative mt-10 sm:mt-14">{children}</div>
    </main>
  );
}
