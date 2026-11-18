import Link from "next/link";
import { Suspense } from "react";
import { userDb } from "@/lib/server/user-db";
import { starterCards } from "@/lib/starters/cards";
import { StarterPicker } from "@/components/starters/starter-picker";
import { ensureSeeded } from "@/lib/server/seed";

export const metadata = { title: "Welcome · Hangar" };

/** First stop after sign-up: pick a starter library or start empty, then connect Claude Code. */
export default function WelcomePage() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pb-28">
      <div className="flex items-center gap-3">
        <span className="ds-pulse" aria-hidden />
        <span className="ds-label">Welcome aboard</span>
      </div>
      <h1 className="ds-display mt-6 max-w-[14ch] !text-[clamp(38px,6vw,84px)]">
        Your hangar is <span className="ds-brand-text">ready.</span>
      </h1>
      <p className="ds-lead mt-6 max-w-[60ch] !text-[clamp(17px,1.8vw,21px)]">
        Your library already has four basic harnesses, so you can try an install right away. Want more? Add a starter pack for
        the kind of work you do, or skip ahead and connect Claude Code.
      </p>
      <Link href="/connect" className="ds-btn ds-btn-ghost mt-6 !px-0 text-accent hover:!bg-transparent">
        Skip for now: connect Claude Code →
      </Link>
      <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-ds-lg bg-sunken" />}>
        <Picker />
      </Suspense>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href="/connect" className="ds-btn ds-btn-glass ds-btn-lg">
          Skip: connect Claude Code →
        </Link>
        <span className="ds-small">One command, then install a basic into an empty folder.</span>
      </div>
    </main>
  );
}

async function Picker() {
  const { userId } = await userDb(); // signed-in only; sends visitors to sign-in
  await ensureSeeded(userId);
  return (
    <div className="mt-12">
      <StarterPicker packs={starterCards()} next={{ href: "/connect", label: "Next: connect Claude Code" }} />
    </div>
  );
}
