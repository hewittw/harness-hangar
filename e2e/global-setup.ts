import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { chromium, type Browser } from "@playwright/test";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { AUTH_FILE_A, baseURL, needsClerkSetup, USER_A_EMAIL, USER_B_EMAIL } from "./env";
import { ensureClerkUser } from "./helpers";

// Runs once, after the dev server is up, and only when sign-in tests will run:
// 1. fetch a Clerk testing token (bypasses bot protection),
// 2. make sure both test users exist,
// 3. sign in as user A once and save the browser state, which every signed-in test reuses.
//    Clerk rate-limits sign-ins, so the suite signs in nowhere else, and a saved state that is still
//    signed in (from an earlier run) is reused instead of signing in again. User B never signs in.
export default async function globalSetup() {
  if (!needsClerkSetup) return;
  await clerkSetup();

  const userA = await ensureClerkUser(USER_A_EMAIL);
  const userB = await ensureClerkUser(USER_B_EMAIL);
  // Env set here is passed on to the test workers.
  process.env.E2E_USER_A_ID = userA;
  process.env.E2E_USER_B_ID = userB;

  const browser = await chromium.launch();
  try {
    if (await savedStateStillSignedIn(browser, userA)) {
      console.log("e2e: reusing the saved sign-in for user A");
      return;
    }
    console.log("e2e: signing in user A");
    const page = await browser.newPage({ baseURL });
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: USER_A_EMAIL });
    const signedInAs = await page.evaluate(() => window.Clerk.user?.id);
    if (signedInAs !== userA) throw new Error(`Signed in as ${signedInAs}, expected ${userA}`);
    await mkdir(dirname(AUTH_FILE_A), { recursive: true });
    await page.context().storageState({ path: AUTH_FILE_A });
  } finally {
    await browser.close();
  }
}

/** True if the saved browser state from an earlier run still has a live Clerk session for user A. */
async function savedStateStillSignedIn(browser: Browser, userA: string): Promise<boolean> {
  if (!existsSync(AUTH_FILE_A)) return false;
  const context = await browser.newContext({ baseURL, storageState: AUTH_FILE_A });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForFunction(() => window.Clerk?.loaded, undefined, { timeout: 30_000 });
    return (await page.evaluate(() => window.Clerk.user?.id ?? null)) === userA;
  } catch {
    return false;
  } finally {
    await context.close();
  }
}
