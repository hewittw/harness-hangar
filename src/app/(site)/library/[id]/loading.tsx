import { BackIcon } from "../ui";

const bar = "animate-pulse rounded-ds-sm bg-ink/[0.07]";

/** Skeleton of a harness page: header and launch card, then a rules section. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-28 sm:px-8 sm:pb-28 sm:pt-32" aria-busy="true" aria-label="Loading harness">
      <span className="ds-label inline-flex items-center gap-2">
        <BackIcon /> Library
      </span>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,480px)] lg:items-start lg:gap-12">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-10 w-10 animate-pulse rounded-ds-md bg-ink/[0.07]" />
            <span className="h-[26px] w-20 animate-pulse rounded-full bg-ink/[0.07]" />
            <span className="h-3 w-28 animate-pulse rounded-full bg-ink/[0.07]" />
          </div>
          <div className={`mt-6 h-[52px] w-3/4 ${bar}`} />
          <div className={`mt-6 h-5 w-full max-w-[520px] ${bar}`} />
          <div className={`mt-3 h-5 w-2/3 max-w-[380px] ${bar}`} />
          <div className="mt-6 flex flex-wrap gap-1.5">
            {[18, 14, 20, 16, 14].map((w, i) => (
              <span key={i} className="h-[26px] animate-pulse rounded-full bg-ink/[0.07]" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </div>
        <div className="ds-glow flex flex-col gap-4 p-6 sm:p-7 [&>*]:relative">
          <span className="h-3 w-32 animate-pulse rounded-full bg-ink/[0.07]" />
          <span className={`h-6 w-3/5 ${bar}`} />
          <span className={`h-4 w-4/5 ${bar}`} />
          <span className="h-[50px] animate-pulse rounded-ds-md bg-ink/[0.07]" />
          <span className="h-3 w-1/2 animate-pulse rounded-full bg-ink/[0.07]" />
        </div>
      </div>

      <section className="pt-16 sm:pt-24">
        <span className="block h-3 w-40 animate-pulse rounded-full bg-ink/[0.07]" />
        <span className={`mt-5 block h-8 w-44 ${bar}`} />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="ds-glow flex flex-col gap-4 p-6 [&>*]:relative">
              <span className={`h-5 w-1/3 ${bar}`} />
              {[0, 1, 2, 3].map((j) => (
                <span key={j} className={`h-4 ${bar}`} style={{ width: `${90 - j * 12}%` }} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
