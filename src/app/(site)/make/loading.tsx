import { MakeShell } from "./shell";

/** Skeleton of the composer: source cards on the left, the summary panel on the right. */
export default function Loading() {
  return (
    <MakeShell>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" aria-busy="true" aria-label="Loading your harnesses">
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ds-glow">
              <div className="relative flex items-center gap-4 px-5 py-5 sm:px-6">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-ds-md bg-sunken" />
                <div className="flex-1">
                  <div className="h-5 w-1/3 animate-pulse rounded-ds-sm bg-sunken" />
                  <div className="mt-2.5 h-3.5 w-2/3 animate-pulse rounded-ds-sm bg-sunken" />
                </div>
                <div className="hidden h-[26px] w-20 animate-pulse rounded-full bg-sunken sm:block" />
              </div>
              {i === 0 && (
                <div className="relative border-t border-hairline px-5 pb-6 pt-5 sm:px-6">
                  <div className="h-3 w-16 animate-pulse rounded-ds-sm bg-sunken" />
                  <div className="mt-4 flex flex-col gap-2">
                    {[0, 1, 2, 3].map((j) => (
                      <div key={j} className="h-11 animate-pulse rounded-ds-md border border-hairline bg-sunken/60" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ds-glow p-6">
          <div className="relative flex flex-col gap-5">
            <div className="h-3 w-24 animate-pulse rounded-ds-sm bg-sunken" />
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="h-3.5 w-20 animate-pulse rounded-ds-sm bg-sunken" />
                <div className="mt-2 h-11 animate-pulse rounded-ds-md bg-sunken" />
              </div>
            ))}
            <div className="flex gap-1.5 border-t border-hairline pt-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[26px] w-20 animate-pulse rounded-full bg-sunken" />
              ))}
            </div>
            <div className="h-[52px] animate-pulse rounded-full bg-sunken" />
          </div>
        </div>
      </div>
    </MakeShell>
  );
}
