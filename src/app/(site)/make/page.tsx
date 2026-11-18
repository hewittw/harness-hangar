import Link from "next/link";
import { userDb } from "@/lib/server/user-db";
import { listHarnesses, loadParts } from "@/lib/server/store";
import { Composer } from "./composer";

export const metadata = { title: "Make harness · Hangar" };

export default async function MakePage() {
  const { db, userId } = await userDb();
  const harnesses = await listHarnesses(userId, db);
  const parts = await loadParts(userId, harnesses.map((h) => h.id), db);

  return (
    <div className="py-14">
      <p className="eyebrow">
        <span className="idx">●</span> Make harness
      </p>
      <h1 className="h-sec mb-4 mt-3.5">Compose a new harness</h1>
      <p className="lede mb-8">
        Pick parts from any of your harnesses. Every deny rule from a harness you use comes along automatically, so a new
        harness is never less safe than the ones it came from.
      </p>
      {harnesses.length === 0 ? (
        <p className="text-dim">
          Save a harness first. See{" "}
          <Link href="/connect" className="text-ign">
            Connect
          </Link>
          .
        </p>
      ) : (
        <Composer harnesses={harnesses.map((h) => ({ id: h.id, name: h.name, description: h.description }))} parts={parts} />
      )}
    </div>
  );
}
