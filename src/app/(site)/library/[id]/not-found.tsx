import Link from "next/link";
import { ArrowIcon, Kicker } from "../ui";

/** Shown for a bad id, or a harness that isn't in this user's library. */
export default function HarnessNotFound() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pb-28 sm:pt-32">
      <section className="ds-glow ds-noise relative mx-auto max-w-[720px] overflow-hidden !rounded-ds-xl px-6 py-14 text-center sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-[560px] -translate-x-1/2 rounded-full opacity-30 blur-[90px]" style={{ background: "var(--brand)" }} aria-hidden />
        <div className="relative flex flex-col items-center">
          <Kicker n="404">Signal lost</Kicker>
          <h1 className="ds-h1 mt-6">Harness not found</h1>
          <p className="ds-lead mx-auto mt-4 max-w-[40ch] !text-[18px]">
            It may have been deleted, or it belongs to another account.
          </p>
          <Link href="/library" className="ds-btn ds-btn-solid ds-btn-lg mt-8">
            Back to your library <ArrowIcon />
          </Link>
        </div>
      </section>
    </main>
  );
}
