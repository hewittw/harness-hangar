import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

/**
 * Backdrop for /sign-in and /sign-up: a smaller version of the landing hero (mesh, stars, horizon)
 * with the wordmark above the Clerk card.
 */
export function AuthShell({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <section className="ds-noise relative flex min-h-[100svh] flex-col items-center overflow-hidden px-4 pb-28 pt-28 sm:px-8 sm:pb-36 sm:pt-32">
      <div className="ds-mesh" aria-hidden>
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="ds-mesh-fade" aria-hidden />
      <div className="ds-stars" aria-hidden />
      <div className="ds-horizon" aria-hidden />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col items-center">
        <Link href="/" aria-label="Hangar home" className="text-ink no-underline">
          <Wordmark />
        </Link>
        <div className="mt-4 flex items-center gap-2.5">
          <span className="ds-pulse" aria-hidden />
          <span className="ds-label !text-ink-2">{kicker}</span>
        </div>
        <div className="relative mt-8 flex w-full justify-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[80px]"
            style={{ background: "var(--brand)" }}
            aria-hidden
          />
          <div className="relative">
            <Suspense fallback={<div className="ds-glow h-[440px] w-[min(400px,calc(100vw-32px))] animate-pulse" />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
