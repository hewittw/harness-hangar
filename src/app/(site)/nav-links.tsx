"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/library", label: "Library" },
  { href: "/make", label: "Make" },
  { href: "/connect", label: "Connect" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="mr-1 flex items-center gap-0.5 sm:mr-2 sm:gap-1">
      {NAV.map((n) => {
        const active = path === n.href || path.startsWith(`${n.href}/`);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`ds-btn ds-btn-ghost ds-btn-sm !px-2.5 sm:!px-3.5 ${active ? "!bg-sunken !text-ink" : ""}`}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
