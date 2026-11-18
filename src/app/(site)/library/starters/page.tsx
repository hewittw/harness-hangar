import Link from "next/link";
import { Suspense } from "react";
import { userDb } from "@/lib/server/user-db";
import { starterCards } from "@/lib/starters/cards";
import { StarterPicker } from "@/components/starters/starter-picker";

export const metadata = { title: "Starter packs · Hangar" };

export default function StartersPage() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 pb-24 pt-32 sm:px-8 sm:pb-28">
      <Link href="/library" className="ds-label no-underline hover:text-ink">
        ← Library
      </Link>
      <h1 className="ds-h1 mt-5">Starter packs</h1>
      <p className="ds-lead mt-4 max-w-[60ch] !text-[clamp(17px,1.8vw,21px)]">
        Ready-made libraries for different kinds of work. Each pack adds three harnesses you can open, rename, compose and
        install like your own. Harnesses you already have are skipped.
      </p>
      <Suspense fallback={<div className="mt-12 h-96 animate-pulse rounded-ds-lg bg-sunken" />}>
        <Picker />
      </Suspense>
    </main>
  );
}

async function Picker() {
  await userDb();
  return (
    <div className="mt-12">
      <StarterPicker packs={starterCards()} />
    </div>
  );
}
