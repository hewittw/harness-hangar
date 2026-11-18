import { clerkSetup } from "@clerk/testing/playwright";
import { needsClerkSetup } from "./env";

// Fetches a Clerk testing token (bypasses bot protection) only when sign-in tests will run.
export default async function globalSetup() {
  if (needsClerkSetup) await clerkSetup();
}
