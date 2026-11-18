import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "../auth-appearance";
import { AuthShell } from "../auth-shell";

export const metadata = { title: "Sign in · Hangar" };

export default function Page() {
  return (
    <AuthShell kicker="Welcome back to the hangar">
      <SignIn appearance={authAppearance} />
    </AuthShell>
  );
}
