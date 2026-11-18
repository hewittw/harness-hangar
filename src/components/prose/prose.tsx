import type { ReactNode } from "react";

/** Long-form page shell in the design system: hero heading, then numbered sections of readable paragraphs. */
export function ProsePage({ kicker, title, lede, children }: { kicker: string; title: ReactNode; lede: ReactNode; children: ReactNode }) {
  return (
    <main className="relative mx-auto max-w-[1240px] px-5 pb-28 pt-32 sm:px-8">
      <div className="pointer-events-none absolute -top-10 right-0 h-80 w-[520px] rounded-full opacity-25 blur-[100px]" style={{ background: "var(--brand)" }} aria-hidden />
      <div className="relative max-w-[760px]">
        <div className="flex items-center gap-3">
          <span className="ds-pulse" aria-hidden />
          <span className="ds-label">{kicker}</span>
        </div>
        <h1 className="ds-display mt-6 !text-[clamp(36px,5.6vw,76px)]">{title}</h1>
        <p className="ds-lead mt-6 !text-[clamp(17px,1.8vw,21px)]">{lede}</p>
        <div className="mt-16 flex flex-col gap-16">{children}</div>
      </div>
    </main>
  );
}

export function ProseSection({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="ds-label !text-accent">{n}</span>
        <span className="h-px w-8 bg-hairline-2" />
      </div>
      <h2 className="ds-h2 mt-4">{title}</h2>
      <div className="mt-5 flex flex-col gap-4 text-[17px] leading-[1.7] text-ink-2 [&_b]:font-semibold [&_b]:text-ink [&_code]:font-[family-name:var(--font-code)] [&_code]:text-[14.5px] [&_code]:text-ink">
        {children}
      </div>
    </section>
  );
}
