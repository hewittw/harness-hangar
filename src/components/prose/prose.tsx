import type { ReactNode } from "react";

/** Info-page hero in the Hangar look: drifting mesh and stars, then the page body. */
export function ProsePage({
  kicker,
  title,
  lede,
  actions,
  children,
}: {
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <section className="ds-noise relative overflow-hidden pt-16">
        <div className="ds-mesh !opacity-60" aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="ds-mesh-fade" aria-hidden />
        <div className="ds-stars" aria-hidden />
        <div className="relative z-10 mx-auto max-w-[1240px] px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-28">
          <div className="flex items-center gap-3">
            <span className="ds-pulse" aria-hidden />
            <span className="ds-label !text-ink-2">{kicker}</span>
          </div>
          <h1 className="ds-display mt-7 max-w-[16ch] !text-[clamp(38px,6.4vw,92px)]">{title}</h1>
          <p className="ds-lead mt-7 max-w-[60ch] !text-[clamp(17px,1.8vw,21px)] !text-ink-2">{lede}</p>
          {actions && <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      </section>
      <main className="mx-auto max-w-[1240px] px-5 pb-28 sm:px-8">
        <div className="flex max-w-[820px] flex-col gap-6">{children}</div>
      </main>
    </>
  );
}

/** A numbered section card for long-form text (About). */
export function ProseSection({ n, title, id, children }: { n: string; title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="ds-glow scroll-mt-32 p-6 sm:p-9">
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

/** One stage of a launch sequence (Demo guide): brand-numbered dot on a glowing rail, content card beside it. */
export function Stage({ n, title, time, last, children }: { n: number; title: string; time?: string; last?: boolean; children: ReactNode }) {
  return (
    <li className="relative grid grid-cols-[44px_1fr] gap-4 sm:grid-cols-[56px_1fr] sm:gap-6">
      {!last && (
        <span
          className="absolute bottom-[-24px] left-[21px] top-12 w-px sm:left-[27px] sm:top-14"
          style={{ background: "linear-gradient(180deg, var(--g2), var(--g4))", boxShadow: "0 0 12px var(--g3)", opacity: 0.7 }}
          aria-hidden
        />
      )}
      <span
        className="relative z-10 grid h-11 w-11 place-items-center rounded-full font-[family-name:var(--font-code)] text-[12.5px] text-white sm:h-14 sm:w-14 sm:text-[13px]"
        style={{ background: "var(--brand)", boxShadow: "0 0 0 5px var(--canvas), 0 0 24px color-mix(in oklab, var(--g3) 55%, transparent)" }}
      >
        {String(n).padStart(2, "0")}
      </span>
      <div className="ds-glow min-w-0 p-5 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="ds-caps text-[19px] sm:text-[22px]">{title}</h2>
          {time && <span className="ds-label">{time}</span>}
        </div>
        <div className="mt-4 flex flex-col gap-4 text-[16.5px] leading-[1.65] text-ink-2 [&_b]:font-semibold [&_b]:text-ink [&_code]:font-[family-name:var(--font-code)] [&_code]:text-[14px] [&_code]:text-ink">
          {children}
        </div>
      </div>
    </li>
  );
}
