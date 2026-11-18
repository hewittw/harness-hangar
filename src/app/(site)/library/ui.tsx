import type { ReactNode } from "react";
import type { PartKind } from "@/lib/harness";

/** Shared pieces for the library pages: section kicker, icons, small formatters. */

/** "01 —— KICKER": the section header used across the site. */
export function Kicker({ n, children }: { n?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {n && <span className="ds-label !text-accent">{n}</span>}
      {n && <span className="h-px w-8 bg-hairline-2" aria-hidden />}
      <span className="ds-label">{children}</span>
    </div>
  );
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const pad2 = (n: number) => String(n).padStart(2, "0");
export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { dateStyle: "medium" });

const ic = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowIcon = ({ className }: { className?: string }) => (
  <svg {...ic} width={16} height={16} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const BackIcon = () => (
  <svg {...ic} width={14} height={14}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);
export const ChevronIcon = ({ className }: { className?: string }) => (
  <svg {...ic} width={16} height={16} className={className}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const RocketIcon = ({ className }: { className?: string }) => (
  <svg {...ic} className={className}>
    <path d="M12 2c3 2.5 4.5 6 4 10l-2 3h-4l-2-3c-.5-4 1-7.5 4-10Z" />
    <path d="M9.5 15 7 19l3-.5M14.5 15l2.5 4-3-.5M12 21v-3" />
    <circle cx="12" cy="9" r="1.5" />
  </svg>
);
export const PlusIcon = () => (
  <svg {...ic} width={16} height={16}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const TrashIcon = () => (
  <svg {...ic} width={16} height={16}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);
export const PencilIcon = () => (
  <svg {...ic}>
    <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
  </svg>
);

const KIND_ICON: Record<PartKind, ReactNode> = {
  rule: <path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3" />,
  skill: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  agent: (
    <>
      <rect x="4" y="7" width="16" height="12" rx="3" />
      <path d="M12 3v4M9 13h.01M15 13h.01" />
    </>
  ),
  mcp_server: <path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7ZM12 17v5" />,
  permission: (
    <>
      <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  hook: <path d="M7 4v9a5 5 0 0 0 10 0v-2M14 14l3-3 3 3" />,
};

export function KindIcon({ kind, className }: { kind: PartKind; className?: string }) {
  return (
    <svg {...ic} className={className}>
      {KIND_ICON[kind]}
    </svg>
  );
}
