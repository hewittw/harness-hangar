import Link from "next/link";
import { userDb } from "@/lib/server/user-db";
import { listHarnesses, loadParts } from "@/lib/server/store";
import { Composer } from "./composer";
import { MakeShell } from "./shell";

export const metadata = { title: "Make harness · Hangar" };

export default async function MakePage() {
  const { db, userId } = await userDb();
  const harnesses = await listHarnesses(userId, db);
  const parts = await loadParts(userId, harnesses.map((h) => h.id), db);

  return (
    <MakeShell>
      {harnesses.length === 0 ? (
        <div className="ds-glow ds-noise relative overflow-hidden !rounded-ds-xl px-6 py-14 text-center sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute -bottom-40 left-1/2 h-72 w-[620px] -translate-x-1/2 rounded-full opacity-35 blur-[90px]"
            style={{ background: "var(--brand)" }}
            aria-hidden
          />
          <div className="relative flex flex-col items-center">
            <span className="grid h-12 w-12 place-items-center rounded-ds-md border border-hairline bg-sunken text-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m12 3 9 5-9 5-9-5 9-5Z" />
                <path d="m3 13 9 5 9-5" />
              </svg>
            </span>
            <h2 className="ds-h2 mt-6">Nothing to compose yet</h2>
            <p className="ds-small mx-auto mt-3 max-w-[44ch]">
              Save a harness from Claude Code first. Once you have one, you can pick parts from it here.
            </p>
            <Link href="/connect" className="ds-btn ds-btn-brand mt-7">
              Connect Claude Code
            </Link>
          </div>
        </div>
      ) : (
        <Composer harnesses={harnesses.map((h) => ({ id: h.id, name: h.name, description: h.description }))} parts={parts} />
      )}
    </MakeShell>
  );
}
