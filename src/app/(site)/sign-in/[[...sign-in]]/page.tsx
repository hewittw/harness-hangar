import { SignIn } from "@clerk/nextjs";
import { authAppearance } from "@/components/clerk-appearance";
import { AuthShell } from "../auth-shell";

export const metadata = { title: "Sign in · Hangar" };

export default function Page() {
  return (
    <AuthShell kicker="Welcome back to the hangar">
      <SignIn appearance={authAppearance} />
    </AuthShell>
  );
}
