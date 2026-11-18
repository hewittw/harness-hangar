// Skeleton in the shape of /connect: header, token card + checklist, token list.
const bar = "animate-pulse rounded-full bg-sunken";

export default function Loading() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-28 sm:px-8 sm:pt-32" aria-busy="true" aria-label="Loading Connect">
      <div className="flex items-center gap-3">
        <span className="ds-pulse" aria-hidden />
        <span className="ds-label !text-ink-2">Loading</span>
      </div>
      <div className={`${bar} mt-6 h-12 w-[min(560px,85%)]`} />
      <div className={`${bar} mt-6 h-4 w-[min(640px,95%)]`} />
      <div className={`${bar} mt-3 h-4 w-[min(420px,70%)]`} />

      <div className="mt-14 grid items-start gap-5 sm:mt-20 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        <div className="ds-glow p-6 sm:p-7">
          <div className="relative">
            <div className={`${bar} h-3 w-32`} />
            <div className={`${bar} mt-6 h-8 w-48`} />
            <div className={`${bar} mt-4 h-3.5 w-[min(360px,90%)]`} />
            <div className="mt-7 h-11 max-w-md animate-pulse rounded-ds-md bg-sunken" />
            <div className={`${bar} mt-6 h-[42px] w-full sm:w-64`} />
          </div>
        </div>
        <div className="ds-card p-6 sm:p-7">
          <div className={`${bar} h-3 w-28`} />
          <div className={`${bar} mt-5 h-6 w-44`} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="mt-5 flex gap-3.5">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-sunken" />
              <div className="flex-1">
                <div className={`${bar} h-3.5 w-3/4`} />
                <div className={`${bar} mt-2 h-3 w-1/2`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 sm:mt-20">
        <div className={`${bar} h-3 w-28`} />
        <div className={`${bar} mt-5 h-8 w-52`} />
        <div className="ds-card ds-divide mt-6 overflow-hidden">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-4 sm:px-6">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-ds-md bg-sunken" />
              <div className="flex-1">
                <div className={`${bar} h-4 w-40`} />
                <div className={`${bar} mt-2 h-3 w-[min(260px,70%)]`} />
              </div>
              <div className={`${bar} hidden h-[34px] w-24 sm:block`} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
