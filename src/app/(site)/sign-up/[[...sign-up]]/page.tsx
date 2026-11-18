import { SignUp } from "@clerk/nextjs";
import { authAppearance } from "@/components/clerk-appearance";
import { AuthShell } from "../../sign-in/auth-shell";

export const metadata = { title: "Sign up · Hangar" };

export default function Page() {
  return (
    <AuthShell kicker="Prepare for launch">
      <SignUp appearance={authAppearance} />
    </AuthShell>
  );
}
