import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { admin } from "@/lib/server/admin";

/** True once the signed-in user has at least one active (unrevoked) Hangar token. */
async function hasActiveToken(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const { count, error } = await admin()
    .from("api_tokens")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (error) {
    console.error("hasActiveToken", error);
    return false;
  }
  return (count ?? 0) > 0;
}

const Arrow = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

/**
 * The landing page's signed-in buttons. Before Claude Code is connected, "Connect" glows;
 * once there's an active token, "Open your library" glows and Connect steps back.
 */
export async function SignedInCtas({ variant }: { variant: "hero" | "final" }) {
  const connected = await hasActiveToken();
  const library = (
    <Link key="library" href="/library" className={`ds-btn ds-btn-lg ${connected ? "ds-btn-brand" : "ds-btn-glass"}`}>
      Open your library {connected && <Arrow />}
    </Link>
  );
  const connect = (
    <Link key="connect" href="/connect" className={`ds-btn ds-btn-lg ${connected ? "ds-btn-glass" : "ds-btn-brand"}`}>
      Connect Claude Code {!connected && <Arrow />}
    </Link>
  );
  if (variant === "final") return connected ? library : connect;
  return <>{connected ? [library, connect] : [connect, library]}</>;
}
