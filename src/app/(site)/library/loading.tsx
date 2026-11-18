import { Kicker } from "./ui";

/** Skeleton of the library: header, telemetry strip, card grid. */
export default function Loading() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-28 sm:px-8 sm:pb-28 sm:pt-32" aria-busy="true" aria-label="Loading your library">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Kicker n="01">Library</Kicker>
          <h1 className="ds-h1 mt-5">Your harnesses</h1>
          <div className="mt-5 h-5 w-[min(420px,80vw)] animate-pulse rounded-full bg-ink/[0.07]" />
        </div>
        <div className="h-[52px] w-52 animate-pulse rounded-full bg-ink/[0.07]" />
      </div>

      <div className="mt-10 h-[54px] animate-pulse rounded-ds-lg border border-hairline bg-ink/[0.04]" />

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="ds-glow flex [&>*]:relative h-[268px] flex-col gap-3 p-6">
            <div className="flex items-start justify-between">
              <span className="h-10 w-10 animate-pulse rounded-ds-md bg-ink/[0.07]" />
              <span className="h-[26px] w-20 animate-pulse rounded-full bg-ink/[0.07]" />
            </div>
            <span className="mt-3 h-6 w-2/3 animate-pulse rounded-ds-sm bg-ink/[0.07]" />
            <span className="h-4 w-full animate-pulse rounded-ds-sm bg-ink/[0.07]" />
            <span className="h-4 w-4/5 animate-pulse rounded-ds-sm bg-ink/[0.07]" />
            <div className="mt-auto flex gap-1.5">
              {[16, 20, 14].map((w) => (
                <span key={w} className="h-[26px] animate-pulse rounded-full bg-ink/[0.07]" style={{ width: `${w * 4}px` }} />
              ))}
            </div>
            <span className="mt-1 h-px bg-hairline" />
            <span className="h-3 w-32 animate-pulse rounded-full bg-ink/[0.07]" />
          </li>
        ))}
      </ul>
    </main>
  );
}
