// Creates the two Clerk test users the e2e suite signs in as, if they don't exist yet. Prints only their user ids.
// Usage: npm run e2e:users   (needs CLERK_SECRET_KEY from a development instance, e.g. in .env.local)
import nextEnv from "@next/env";
import { createClerkClient } from "@clerk/backend";

nextEnv.loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error });

const secretKey = process.env.CLERK_SECRET_KEY?.trim();
if (!secretKey) {
  console.error("CLERK_SECRET_KEY is not set.");
  process.exit(1);
}
if (!secretKey.startsWith("sk_test_")) {
  console.error("Refusing to create test users: CLERK_SECRET_KEY is not a development-instance key (sk_test_).");
  process.exit(1);
}

// +clerk_test emails never receive mail and accept the code 424242.
const emails = [
  process.env.E2E_CLERK_USER_A_EMAIL?.trim() || "hangar-a+clerk_test@example.com",
  process.env.E2E_CLERK_USER_B_EMAIL?.trim() || "hangar-b+clerk_test@example.com",
];

const clerk = createClerkClient({ secretKey });

async function ensureUser(email) {
  const { data } = await clerk.users.getUserList({ emailAddress: [email] });
  const found = data.find((u) => u.emailAddresses.some((e) => e.emailAddress.toLowerCase() === email.toLowerCase()));
  if (found) return found.id;
  // The suite signs in with a sign-in token (ticket), so the user needs no password.
  const created = await clerk.users.createUser({ emailAddress: [email], skipPasswordRequirement: true, skipPasswordChecks: true });
  return created.id;
}

try {
  for (const email of emails) console.log(await ensureUser(email));
} catch (e) {
  // Clerk API errors carry a code and message, never the secret key.
  const errors = e?.errors?.map((x) => `${x.code}: ${x.longMessage ?? x.message}`).join("; ");
  console.error(`Could not create the e2e users: ${errors || e?.message || e}`);
  process.exit(1);
}
