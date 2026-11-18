import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex justify-center py-16">
      <Suspense>
        <SignUp />
      </Suspense>
    </div>
  );
}
