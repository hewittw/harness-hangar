import Link from "next/link";
import { Suspense } from "react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/library", label: "Library" },
  { href: "/make", label: "Make harness" },
  { href: "/connect", label: "Connect" },
];

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen pt-[60px] pb-[44px]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between gap-6 border-b border-line bg-bg/90 px-5 backdrop-blur sm:px-8">
        <Link
          href="/"
          className="font-dinc text-lg font-bold uppercase tracking-[0.2em] no-underline"
        >
          Hangar
        </Link>
        <Suspense fallback={<span className="h-7 w-7" />}>
          <nav className="flex items-center gap-5 sm:gap-7">
            <Show when="signed-in">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="font-din text-[11px] font-bold uppercase tracking-[0.18em] text-dim no-underline hover:text-fg"
                >
                  {n.label}
                </Link>
              ))}
              <UserButton />
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="btn btn-ghost !py-2">Sign in</button>
              </SignInButton>
            </Show>
          </nav>
        </Suspense>
      </header>
      <main className="mx-auto max-w-[1080px] px-[6vw] xl:px-0">
        {children}
      </main>
      <footer className="fixed inset-x-0 bottom-0 z-40 flex h-[44px] items-center justify-center gap-2.5 border-t border-line bg-bg/90 px-4 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-dim backdrop-blur">
        <i className="h-1.5 w-1.5 rounded-full bg-ign" aria-hidden />
        Hangar v1 · your harnesses, ready to launch
      </footer>
    </div>
  );
}
