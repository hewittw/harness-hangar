import { loadEnvConfig } from "@next/env";

// Load env files the same way `next dev` does, so local runs pick up the keys the app uses.
// In CI (or with no env files) this is a no-op and every test that needs keys skips itself.
loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

const val = (name: string) => process.env[name]?.trim() || undefined;
const missing = (names: string[]) => names.filter((n) => !val(n));

/** Keys the app itself needs to run (sign-in, database). */
const APP_KEYS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
];
const CLERK_KEYS = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY"];
const SUPABASE_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"];

/** Test an already-running app (local or preview) instead of starting one. */
export const externalBaseUrl = val("E2E_BASE_URL")?.replace(/\/$/, "");
export const port = Number(val("E2E_PORT") ?? 3100);
export const baseURL = externalBaseUrl ?? `http://localhost:${port}`;

const missingApp = missing(APP_KEYS);
/** Start `next dev` only when it can actually work and no external URL was given. */
export const startWebServer = !externalBaseUrl && missingApp.length === 0;
const serverAvailable = !!externalBaseUrl || missingApp.length === 0;

const missingClerk = missing(CLERK_KEYS);
const devClerkKeys =
  !missingClerk.length && val("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")!.startsWith("pk_test_") && val("CLERK_SECRET_KEY")!.startsWith("sk_test_");
const missingSupabase = missing(SUPABASE_KEYS);

function reason(parts: string[]): string | undefined {
  return parts.length ? parts.join("; ") : undefined;
}

const serverReason = serverAvailable ? [] : [`no app to test: set E2E_BASE_URL or ${missingApp.join(", ")}`];
const clerkReason = missingClerk.length
  ? [`Clerk keys missing: ${missingClerk.join(", ")}`]
  : devClerkKeys
    ? []
    : ["Clerk testing needs development-instance keys (pk_test_/sk_test_)"];

/** Why a test that only needs the app running must skip, or undefined if it can run. */
export const skipNoServer = reason(serverReason);
/** Why a test that signs in a Clerk test user must skip. */
export const skipNoSignIn = reason([...serverReason, ...clerkReason]);
/** Why the RLS test (needs the Supabase secret key for setup/cleanup) must skip. */
export const skipNoRls = reason([
  ...serverReason,
  ...clerkReason,
  ...(missingSupabase.length ? [`Supabase keys missing: ${missingSupabase.join(", ")}`] : []),
]);

/** Run clerkSetup() in global setup only when sign-in tests will run. */
export const needsClerkSetup = !skipNoSignIn;

// Clerk test emails (+clerk_test) sign in with code 424242 and never receive real mail.
export const USER_A_EMAIL = val("E2E_CLERK_USER_A_EMAIL") ?? "hangar-a+clerk_test@example.com";
export const USER_B_EMAIL = val("E2E_CLERK_USER_B_EMAIL") ?? "hangar-b+clerk_test@example.com";

export const env = (name: string): string => {
  const v = val(name);
  if (!v) throw new Error(`${name} is not set`);
  return v;
};
