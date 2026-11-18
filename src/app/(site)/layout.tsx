import Link from "next/link";
import { Suspense } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/wordmark";
import { NavLinks } from "./nav-links";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="ds flex min-h-screen flex-col">
      <header className="ds-glass fixed inset-x-0 top-0 z-50 border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="Hangar home" className="text-ink no-underline">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Suspense fallback={null}>
              <Show when="signed-in">
                <NavLinks />
              </Show>
            </Suspense>
            <ThemeToggle />
            <Suspense fallback={<span className="h-8 w-8" />}>
              <Show when="signed-in">
                <span className="ml-1 grid h-8 w-8 place-items-center">
                  <UserButton />
                </span>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="ds-btn ds-btn-ghost ds-btn-sm hidden sm:inline-flex">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="ds-btn ds-btn-solid ds-btn-sm">Get started</button>
                </SignUpButton>
              </Show>
            </Suspense>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-4 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
          <Wordmark size="sm" />
          <div className="flex items-center gap-3">
            <span className="ds-pulse" aria-hidden />
            <span className="ds-label">Hangar v1 · your harnesses, ready to launch</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
