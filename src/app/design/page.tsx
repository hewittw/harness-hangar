import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { AccentPicker } from "@/components/accent-picker";
import { DsCopy } from "./ds-copy";

export const metadata: Metadata = { title: "Design system · Hangar" };

const SECTIONS = [
  ["principles", "Principles"],
  ["color", "Color"],
  ["type", "Type"],
  ["components", "Components"],
  ["patterns", "Patterns"],
  ["themes", "Light & dark"],
] as const;

const COLORS = [
  ["canvas", "Page background"],
  ["raised", "Cards, inputs"],
  ["sunken", "Wells, code, hover"],
  ["ink", "Primary text"],
  ["ink-2", "Secondary text"],
  ["ink-3", "Labels, hints"],
  ["hairline", "Borders"],
  ["hairline-2", "Strong borders"],
  ["accent", "One accent, used sparingly"],
  ["ok", "Success"],
  ["warn", "Warning"],
  ["danger", "Destructive"],
] as const;

const KINDS = ["Rules", "Skills", "Subagents", "MCP servers", "Permissions", "Hooks"];

export default function DesignSystemPage() {
  // A local tool for choosing the look; not part of the live site.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="ds min-h-screen">
      <header className="ds-glass sticky top-0 z-50 border-b border-hairline">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="ds-label hidden sm:inline">Design system</span>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="ds-btn ds-btn-ghost ds-btn-sm">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <AccentPicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* ---------- hero ---------- */}
        <section className="ds-grid-bg -mx-5 border-b border-hairline px-5 pb-20 pt-20 sm:-mx-8 sm:px-8 sm:pt-28">
          <div className="flex items-center gap-2.5">
            <span className="ds-pulse" aria-hidden />
            <span className="ds-label">Hangar design system · v2 draft</span>
          </div>
          <h1 className="ds-display ds-gradient-text mt-6 max-w-[14ch]">Precise. Calm. Ready to launch.</h1>
          <p className="ds-lead mt-6 max-w-[60ch]">
            Apple&apos;s clarity and warmth, SpaceX&apos;s precision and night-sky contrast. One typeface family, one accent,
            hairline borders, and small mono &ldquo;telemetry&rdquo; labels. Use the switches in the top bar to try light and dark,
            and the three accents.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#patterns" className="ds-btn ds-btn-primary ds-btn-lg">
              See it in Hangar
            </a>
            <a href="#components" className="ds-btn ds-btn-secondary ds-btn-lg">
              Components
            </a>
          </div>
        </section>

        {/* ---------- principles ---------- */}
        <Section id="principles" n="01" title="Principles">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Quiet by default", "Neutral surfaces and generous space. Content is the loudest thing on the page."],
              ["One accent", "The accent marks the single most important action or state on a screen, never decoration."],
              ["Hairlines, not boxes", "1px borders at low contrast separate things. Shadows only to lift what you can act on."],
              ["Telemetry details", "Small mono labels, live dots and tabular numbers give the mission-control feel."],
            ].map(([t, d], i) => (
              <div key={t} className="ds-card p-6">
                <span className="ds-label ds-label-accent">0{i + 1}</span>
                <h3 className="ds-h3 mt-4">{t}</h3>
                <p className="ds-small mt-2">{d}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------- color ---------- */}
        <Section id="color" n="02" title="Color" lede="Twelve tokens. Every color on the site comes from this list, so light and dark mode stay in sync.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COLORS.map(([token, use]) => (
              <div key={token} className="ds-card overflow-hidden">
                <div className="h-20 border-b border-hairline" style={{ background: `var(--${token})` }} />
                <div className="p-4">
                  <p className="ds-mono text-ink">--{token}</p>
                  <p className="ds-small mt-1">{use}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------- type ---------- */}
        <Section id="type" n="03" title="Type" lede="Geist for everything you read, Geist Mono for labels, code and numbers. Tight tracking on big sizes, like Apple.">
          <div className="ds-card ds-divide">
            {[
              ["Display", "ds-display", "Your whole Claude."],
              ["H1", "ds-h1", "Compose a new harness"],
              ["H2", "ds-h2", "Everything around the model"],
              ["H3", "ds-h3", "Web class harness"],
              ["Lead", "ds-lead", "Save the harness you already have, mix its parts into new ones, and install it anywhere."],
              ["Body", "ds-body", "Claude distills your instructions and memory into portable rules, and keeps your skills, MCP servers and deny rules exactly as they are."],
              ["Small", "ds-small", "Updated Nov 18, 2026 · 32 rules · 2 skills"],
              ["Label", "ds-label", "Mission 04 · Launch"],
              ["Mono", "ds-mono", "/mcp__hangar__install-harness"],
            ].map(([name, cls, sample]) => (
              <div key={name} className="grid gap-2 px-6 py-5 sm:grid-cols-[120px_1fr] sm:items-baseline">
                <span className="ds-label">{name}</span>
                <span className={cls}>{sample}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ---------- components ---------- */}
        <Section id="components" n="04" title="Components">
          <div className="grid gap-4 lg:grid-cols-2">
            <Demo title="Buttons">
              <div className="flex flex-wrap items-center gap-3">
                <button className="ds-btn ds-btn-primary">Primary</button>
                <button className="ds-btn ds-btn-accent">Accent</button>
                <button className="ds-btn ds-btn-secondary">Secondary</button>
                <button className="ds-btn ds-btn-ghost">Ghost</button>
                <button className="ds-btn ds-btn-danger">Delete</button>
                <button className="ds-btn ds-btn-primary" disabled>
                  Disabled
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button className="ds-btn ds-btn-primary ds-btn-sm">Small</button>
                <button className="ds-btn ds-btn-primary">Medium</button>
                <button className="ds-btn ds-btn-primary ds-btn-lg">Large</button>
                <ThemeToggle />
              </div>
            </Demo>

            <Demo title="Form">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="ds-field">
                  <span>Harness name</span>
                  <input className="ds-input" placeholder="e.g. Web class + lab" />
                </label>
                <label className="ds-field">
                  <span>What it&apos;s for</span>
                  <input className="ds-input" defaultValue="Full-stack Next.js work" />
                </label>
              </div>
              <div className="mt-4 flex flex-col gap-2.5">
                <label className="flex items-center gap-2.5 text-[15px]">
                  <input type="checkbox" className="ds-check" defaultChecked /> Ask before deploying
                </label>
                <label className="flex items-center gap-2.5 text-[15px]">
                  <input type="checkbox" className="ds-check" /> Verify UI in a real browser
                </label>
                <label className="flex items-center gap-2.5 text-[15px] text-ink-3">
                  <input type="checkbox" className="ds-check" defaultChecked disabled /> deny Read(./.env)
                  <span className="ds-chip ds-chip-accent">always included</span>
                </label>
              </div>
            </Demo>

            <Demo title="Chips">
              <div className="flex flex-wrap gap-2">
                {KINDS.map((k, i) => (
                  <span key={k} className="ds-chip">
                    {[32, 2, 1, 1, 8, 3][i]} {k.toLowerCase()}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="ds-chip ds-chip-accent">
                  <span className="ds-dot" /> Composed
                </span>
                <span className="ds-chip ds-chip-ok">
                  <span className="ds-dot" /> Connected
                </span>
                <span className="ds-chip ds-chip-danger">deny</span>
                <span className="ds-chip">allow</span>
              </div>
            </Demo>

            <Demo title="Code & keys">
              <div className="flex items-start gap-2">
                <pre className="ds-code flex-1">/mcp__hangar__install-harness &quot;Web class&quot;</pre>
                <DsCopy text='/mcp__hangar__install-harness "Web class"' />
              </div>
              <p className="ds-small mt-3">
                Press <kbd className="ds-kbd">⌘</kbd> <kbd className="ds-kbd">K</kbd> to search your library.
              </p>
            </Demo>

            <Demo title="Telemetry" className="lg:col-span-2">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-ds-md bg-hairline sm:grid-cols-4">
                {[
                  ["Harnesses", "3"],
                  ["Parts", "111"],
                  ["Deny rules", "8"],
                  ["Last launch", "2m"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-raised p-5">
                    <p className="ds-label">{k}</p>
                    <p className="ds-stat-value mt-3">{v}</p>
                  </div>
                ))}
              </div>
            </Demo>
          </div>
        </Section>

        {/* ---------- patterns ---------- */}
        <Section id="patterns" n="05" title="Patterns" lede="Real Hangar screens built from the pieces above.">
          {/* nav */}
          <p className="ds-label mb-3">Top bar</p>
          <div className="ds-card overflow-hidden">
            <div className="ds-glass flex h-14 items-center justify-between gap-4 border-b border-hairline px-5">
              <Wordmark />
              <div className="hidden items-center gap-1 sm:flex">
                <span className="ds-btn ds-btn-ghost ds-btn-sm !text-ink">Library</span>
                <span className="ds-btn ds-btn-ghost ds-btn-sm">Make harness</span>
                <span className="ds-btn ds-btn-ghost ds-btn-sm">Connect</span>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[13px] font-semibold text-accent-ink">H</span>
              </div>
            </div>
            <div className="ds-grid-bg px-6 py-14 sm:px-10">
              <span className="ds-label">Harness library · v1</span>
              <h2 className="ds-h1 mt-4 max-w-[18ch]">Your whole Claude. Ready to launch.</h2>
              <p className="ds-lead mt-4 max-w-[52ch]">
                Save the harness you already have, mix its parts into new ones, and install it into any new folder.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="ds-btn ds-btn-accent ds-btn-lg">Connect Claude Code</span>
                <span className="ds-btn ds-btn-secondary ds-btn-lg">Open library</span>
              </div>
            </div>
          </div>

          {/* library */}
          <p className="ds-label mb-3 mt-12">Library</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { n: "Web app", d: "Next.js, Clerk, Supabase with RLS, real-browser checks.", c: [32, 2, 1, 4], composed: false },
              { n: "Life harness", d: "Daily check-ins with hooks that keep private data off-limits.", c: [16, 2, 0, 4], composed: false },
              { n: "Web + life", d: "Composed from both. Deny rules carried over.", c: [32, 2, 1, 8], composed: true },
            ].map((h) => (
              <div key={h.n} className="ds-card ds-card-hover flex flex-col gap-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="ds-h3">{h.n}</h3>
                  <span className={`ds-chip ${h.composed ? "ds-chip-accent" : ""}`}>{h.composed ? "Composed" : "Saved"}</span>
                </div>
                <p className="ds-small">{h.d}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  <span className="ds-chip">{h.c[0]} rules</span>
                  <span className="ds-chip">{h.c[1]} skills</span>
                  {h.c[2] > 0 && <span className="ds-chip">{h.c[2]} MCP server</span>}
                  <span className="ds-chip">{h.c[3]} permissions</span>
                </div>
                <p className="ds-label !tracking-[0.12em]">Updated Nov 18</p>
              </div>
            ))}
          </div>

          {/* detail + connect */}
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="ds-label mb-3">Harness detail</p>
              <div className="ds-card ds-divide">
                <div className="px-6 py-5">
                  <p className="ds-label">Safety</p>
                  <ul className="mt-3 space-y-2 text-[15.5px]">
                    <li className="flex gap-3">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                      Never spend money. Free tiers only; if an action might cost money, stop and ask.
                    </li>
                    <li className="flex gap-3">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                      Keys live only in env files and host env vars. Never print a key.
                    </li>
                  </ul>
                </div>
                {[
                  ["deny", "Read(./.env)"],
                  ["deny", "mcp__supabase__execute_sql"],
                  ["allow", "Bash(npm run *)"],
                ].map(([e, r]) => (
                  <div key={r} className="flex items-center gap-3 px-6 py-3.5">
                    <span className={`ds-chip ${e === "deny" ? "ds-chip-danger" : ""}`}>{e}</span>
                    <code className="ds-mono">{r}</code>
                  </div>
                ))}
                <details className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <span className="font-medium">verify-ui</span>
                    <span className="ds-small">1 file ▾</span>
                  </summary>
                  <pre className="ds-code mt-3">{"# Verify UI\nOpen the page in a real browser and check it at 390px and 1440px."}</pre>
                </details>
              </div>
            </div>
            <div>
              <p className="ds-label mb-3">Connect</p>
              <div className="ds-card flex flex-col gap-4 p-6">
                <div className="flex items-center gap-2">
                  <span className="ds-chip ds-chip-ok">
                    <span className="ds-dot" /> Token ready
                  </span>
                </div>
                <h3 className="ds-h3">Paste this into your terminal</h3>
                <pre className="ds-code">{'claude mcp add --transport http --scope user hangar https://harness-hangar.vercel.app/api/mcp --header "Authorization: Bearer hk_••••"'}</pre>
                <div className="flex items-center gap-3">
                  <button className="ds-btn ds-btn-accent">Copy command</button>
                  <span className="ds-small">Shown once.</span>
                </div>
              </div>

              <p className="ds-label mb-3 mt-8">Empty state</p>
              <div className="ds-panel flex flex-col items-center gap-3 px-6 py-10 text-center">
                <span className="ds-pulse" aria-hidden />
                <h3 className="ds-h3">No harnesses yet</h3>
                <p className="ds-small max-w-[34ch]">
                  In a project you like, run <span className="ds-mono text-ink">/mcp__hangar__save-harness</span>.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* ---------- themes ---------- */}
        <Section id="themes" n="06" title="Light & dark" lede="The same card in both themes. The toggle in the top bar switches the whole page; this compares them side by side.">
          <div className="grid gap-4 md:grid-cols-2">
            {(["light", "dark"] as const).map((t) => (
              <div key={t} data-theme={t} className="ds rounded-ds-xl border border-hairline p-6 sm:p-8">
                <span className="ds-label">{t} mode</span>
                <div className="ds-card mt-4 flex flex-col gap-3 p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="ds-h3">Web app</h3>
                    <span className="ds-chip ds-chip-accent">
                      <span className="ds-dot" /> Composed
                    </span>
                  </div>
                  <p className="ds-small">Next.js, Clerk, Supabase with RLS, real-browser checks.</p>
                  <div className="flex gap-2 pt-2">
                    <button className="ds-btn ds-btn-accent ds-btn-sm">Launch</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm">View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </main>

      <footer className="mt-24 border-t border-hairline">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-8 sm:px-8">
          <Wordmark />
          <span className="ds-label">Local only · not deployed</span>
        </div>
      </footer>
    </div>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M2.5 20.5V10L12 4l9.5 6v10.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 20.5v-6h10v6" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      Hangar
    </span>
  );
}

function Section({ id, n, title, lede, children }: { id: string; n: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-b border-hairline py-20">
      <span className="ds-label ds-label-accent">{n}</span>
      <h2 className="ds-h1 mt-3">{title}</h2>
      {lede && <p className="ds-lead mt-4 max-w-[60ch]">{lede}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function Demo({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`ds-card p-6 ${className}`}>
      <p className="ds-label mb-5">{title}</p>
      {children}
    </div>
  );
}
