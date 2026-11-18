import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PalettePicker } from "@/components/palette-picker";
import { DsCopy } from "./ds-copy";

export const metadata: Metadata = { title: "Design system · Hangar" };

const NAV = [
  ["command", "Command bar"],
  ["sequence", "Launch sequence"],
  ["bento", "Harness"],
  ["screens", "Screens"],
  ["foundations", "Foundations"],
  ["themes", "Light & dark"],
] as const;

export default function DesignSystemPage() {
  // A local tool for choosing the look; never part of the live site.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="ds min-h-screen overflow-x-clip">
      {/* ================= top bar ================= */}
      <header className="ds-glass fixed inset-x-0 top-0 z-50 border-b border-hairline">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-8">
          <Wordmark />
          <nav className="flex items-center gap-1">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="ds-btn ds-btn-ghost ds-btn-sm">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <PalettePicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ================= hero: Stripe mesh + SpaceX horizon ================= */}
      <section className="ds-noise relative flex min-h-[100vh] flex-col overflow-hidden pt-16">
        <div className="ds-mesh" aria-hidden>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="ds-mesh-fade" aria-hidden />
        <div className="ds-stars" aria-hidden />
        <div className="ds-horizon" aria-hidden />

        <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center px-8 pb-40 pt-24">
          <div className="flex items-center gap-3">
            <span className="ds-pulse" aria-hidden />
            <span className="ds-label !text-ink-2">Mission 01 · Hangar design system v3</span>
          </div>
          <h1 className="ds-display mt-8 max-w-[12ch]">
            Launch your <span className="ds-brand-text">whole Claude.</span>
          </h1>
          <p className="ds-lead mt-8 max-w-[56ch] !text-ink-2">
            Save the harness you already built: rules, skills, MCP servers, deny rules, hooks. Compose new ones from its parts.
            Install it into any folder with one command.
          </p>
          <div className="mt-10 flex items-center gap-3">
            <a href="#command" className="ds-btn ds-btn-brand ds-btn-lg">
              Connect Claude Code <Arrow />
            </a>
            <a href="#screens" className="ds-btn ds-btn-glass ds-btn-lg">
              Open your library
            </a>
          </div>
        </div>

        {/* telemetry strip */}
        <div className="relative z-10 border-t border-hairline">
          <div className="ds-glass">
            <div className="mx-auto grid max-w-[1240px] grid-cols-5 divide-x divide-hairline px-8">
              {[
                ["T+", "00:00:04"],
                ["Harnesses", "03"],
                ["Parts", "111"],
                ["Deny rules", "08"],
                ["Status", "Nominal"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 px-6 py-5 first:pl-0 last:pr-0">
                  <span className="ds-label">{k}</span>
                  <span className={`ds-mono text-[14px] ${v === "Nominal" ? "text-ok" : "text-ink"}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1240px] px-8">
        {/* ================= command bar (Raycast) ================= */}
        <Section id="command" n="01" kicker="Raycast-style" title="Everything is one command away" lede="The website and your terminal are two views of the same library. A ⌘K bar for the web; slash commands in Claude Code.">
          <div className="relative grid grid-cols-[1.15fr_1fr] items-center gap-12">
            <div className="pointer-events-none absolute -left-20 top-1/2 h-[420px] w-[620px] -translate-y-1/2 rounded-full opacity-40 blur-[90px]" style={{ background: "var(--brand)" }} aria-hidden />
            <div className="ds-glow relative overflow-hidden !rounded-ds-xl" style={{ boxShadow: "var(--shadow-pop)" }}>
              <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
                <SearchIcon />
                <span className="text-[17px] text-ink">install</span>
                <span className="h-5 w-px animate-pulse bg-accent" />
                <span className="ml-auto flex gap-1">
                  <kbd className="ds-kbd">⌘</kbd>
                  <kbd className="ds-kbd">K</kbd>
                </span>
              </div>
              <div className="p-2">
                <p className="ds-label px-3 pb-2 pt-3">Harnesses</p>
                {[
                  { n: "Install “Web app”", d: "32 rules · 2 skills · 1 MCP server", active: true },
                  { n: "Install “Life harness”", d: "16 rules · 4 hooks" },
                  { n: "Install “Web + life”", d: "Composed · 8 deny rules" },
                ].map((r) => (
                  <div key={r.n} className={`flex items-center gap-3 rounded-ds-md px-3 py-2.5 ${r.active ? "bg-sunken" : ""}`}>
                    <span className="grid h-8 w-8 place-items-center rounded-ds-sm" style={{ background: r.active ? "var(--brand)" : "var(--sunken)" }}>
                      <RocketIcon light={r.active} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[15px] font-semibold">{r.n}</span>
                      <span className="block text-[13px] text-ink-3">{r.d}</span>
                    </span>
                    {r.active && <kbd className="ds-kbd">↵</kbd>}
                  </div>
                ))}
                <p className="ds-label px-3 pb-2 pt-4">Actions</p>
                {["Make a harness from parts…", "Copy connect command", "Revoke a token…"].map((a) => (
                  <div key={a} className="flex items-center gap-3 rounded-ds-md px-3 py-2.5 text-[15px] text-ink-2">
                    <span className="grid h-8 w-8 place-items-center rounded-ds-sm bg-sunken text-ink-3">→</span>
                    {a}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-hairline px-5 py-3">
                <Wordmark small />
                <span className="ds-small flex items-center gap-2">
                  Open <kbd className="ds-kbd">↵</kbd> Actions <kbd className="ds-kbd">⌘</kbd>
                  <kbd className="ds-kbd">.</kbd>
                </span>
              </div>
            </div>

            <div className="ds-terminal relative">
              <div className="ds-terminal-bar">
                <i style={{ background: "#ff5f57" }} />
                <i style={{ background: "#febc2e" }} />
                <i style={{ background: "#28c840" }} />
                <span className="ml-3 font-[family-name:var(--font-code)] text-[12px] text-white/40">~/new-project — claude</span>
              </div>
              <pre>
                <span className="text-white/40">{"> "}</span>
                <span className="text-white">/mcp__hangar__install-harness</span> <span style={{ color: "var(--g1)" }}>&quot;Web app&quot;</span>
                {"\n\n"}
                <span className="text-white/50">{"⏺ "}</span>What is this folder for?{"\n"}
                <span className="text-white/40">{"> "}</span>a dashboard for my lab&apos;s experiments{"\n\n"}
                <span className="text-white/50">{"⏺ "}</span>Writing 7 files…{"\n"}
                {"  "}
                <span style={{ color: "var(--g2)" }}>✓</span> AGENTS.md <span className="text-white/35">32 rules</span>
                {"\n  "}
                <span style={{ color: "var(--g2)" }}>✓</span> .claude/skills/verify-ui{"\n  "}
                <span style={{ color: "var(--g2)" }}>✓</span> .claude/settings.json <span className="text-white/35">4 deny</span>
                {"\n  "}
                <span style={{ color: "var(--g2)" }}>✓</span> .mcp.json <span className="text-white/35">needs SUPABASE_PROJECT_REF</span>
                {"\n\n"}
                <span style={{ color: "var(--g3)" }}>Launch complete.</span> <span className="text-white/50">Restart Claude Code to load it.</span>
              </pre>
            </div>
          </div>
        </Section>

        {/* ================= launch sequence (SpaceX) ================= */}
        <Section id="sequence" n="02" kicker="SpaceX-style" title="Launch sequence" lede="Four stages from the setup you have to a new Claude that works the same way.">
          <div className="relative">
            <div className="absolute left-0 right-0 top-[27px] h-px bg-hairline-2" aria-hidden />
            <div className="absolute left-0 top-[27px] h-px w-[62%]" style={{ background: "var(--brand)", boxShadow: "0 0 18px var(--g3)" }} aria-hidden />
            <ol className="relative grid grid-cols-4 gap-8">
              {[
                ["Connect", "One command adds Hangar to Claude Code for every folder on your computer.", "done"],
                ["Save", "Claude distills your instructions into portable rules and keeps skills, MCPs and deny rules.", "done"],
                ["Compose", "Pick parts from any harness. Deny rules always come along.", "live"],
                ["Launch", "In an empty folder, one command writes the whole setup.", "next"],
              ].map(([t, d, s], i) => (
                <li key={t}>
                  <span
                    className={`relative grid h-14 w-14 place-items-center rounded-full border font-[family-name:var(--font-code)] text-[13px] ${
                      s === "next" ? "border-hairline-2 bg-canvas text-ink-3" : "border-transparent text-white"
                    }`}
                    style={s !== "next" ? { background: "var(--brand)", boxShadow: s === "live" ? "0 0 0 6px var(--accent-soft), 0 0 30px var(--g3)" : undefined } : undefined}
                  >
                    0{i + 1}
                  </span>
                  <p className="ds-caps mt-6 text-[22px]">{t}</p>
                  <p className="ds-small mt-2 max-w-[28ch]">{d}</p>
                  <p className={`ds-label mt-4 ${s === "live" ? "!text-accent" : ""}`}>{s === "done" ? "Complete" : s === "live" ? "In progress" : "Standby"}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        {/* ================= bento (Stripe/Raycast) ================= */}
        <Section id="bento" n="03" kicker="Stripe-style" title="Everything around the model" lede="Plugins share single pieces. Hangar keeps the whole harness, including the parts that enforce rules.">
          <div className="grid auto-rows-[220px] grid-cols-6 gap-4">
            <Bento className="col-span-3 row-span-2" icon={<RulesIcon />} title="Instructions & memory" sub="Distilled into portable rules" featured>
              <div className="mt-6 space-y-2.5">
                {["Ask before deploying or spending money.", "Verify UI in a real browser at phone and desktop sizes.", "Keys live in env vars. Never print one."].map((r) => (
                  <div key={r} className="flex items-start gap-3 rounded-ds-md border border-hairline bg-canvas/60 px-4 py-3 text-[15px]">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--brand)" }} />
                    {r}
                  </div>
                ))}
              </div>
            </Bento>
            <Bento className="col-span-3" icon={<ShieldIcon />} title="Permissions & hooks" sub="Deny rules always carry over">
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="ds-chip ds-chip-danger">deny Read(./.env)</span>
                <span className="ds-chip ds-chip-danger">deny git push --force</span>
                <span className="ds-chip">allow npm run *</span>
              </div>
            </Bento>
            <Bento className="col-span-2" icon={<BoltIcon />} title="Skills" sub="Kept exactly" />
            <Bento className="col-span-1" icon={<PlugIcon />} title="MCP" sub="Keys → ${VARS}" compact />
            <Bento className="col-span-2" icon={<AgentIcon />} title="Subagents" sub="Kept exactly" />
            <Bento className="col-span-4" icon={<ScanIcon />} title="Leak scan" sub="Every upload is checked for keys, emails and home paths before it's stored">
              <div className="mt-4 flex items-center gap-3">
                <span className="ds-chip ds-chip-ok">
                  <span className="ds-dot" /> 0 secrets
                </span>
                <span className="ds-chip ds-chip-ok">
                  <span className="ds-dot" /> 0 emails
                </span>
                <span className="ds-chip ds-chip-ok">
                  <span className="ds-dot" /> 0 home paths
                </span>
              </div>
            </Bento>
          </div>
        </Section>

        {/* ================= screens ================= */}
        <Section id="screens" n="04" kicker="In the app" title="Your library" lede="Real Hangar screens built from the pieces in this system.">
          <div className="grid grid-cols-3 gap-4">
            {[
              { n: "Web app", d: "Next.js, Clerk, Supabase with RLS, real-browser checks.", c: ["32 rules", "2 skills", "1 MCP"], composed: false },
              { n: "Life harness", d: "Daily check-ins; hooks keep private data off-limits.", c: ["16 rules", "2 skills", "4 hooks"], composed: false },
              { n: "Web + life", d: "Composed from both. Every deny rule carried over.", c: ["32 rules", "3 hooks", "8 deny"], composed: true },
            ].map((h) => (
              <div key={h.n} className="ds-glow ds-lift flex flex-col gap-3 p-6">
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-ds-md" style={{ background: h.composed ? "var(--brand)" : "var(--sunken)" }}>
                    <RocketIcon light={h.composed} />
                  </span>
                  <span className={`ds-chip ${h.composed ? "ds-chip-brand" : ""}`}>{h.composed ? "Composed" : "Saved"}</span>
                </div>
                <h3 className="ds-h3 mt-2">{h.n}</h3>
                <p className="ds-small">{h.d}</p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                  {h.c.map((x) => (
                    <span key={x} className="ds-chip">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-[1fr_1.1fr] gap-4">
            <div className="ds-glow p-7">
              <div className="flex items-center justify-between">
                <span className="ds-label">Connect · step 2</span>
                <span className="ds-chip ds-chip-ok">
                  <span className="ds-dot" /> Token ready
                </span>
              </div>
              <h3 className="ds-h2 mt-5">Paste this into your terminal</h3>
              <div className="mt-5 flex items-start gap-2">
                <pre className="ds-code flex-1">{'claude mcp add --transport http --scope user hangar https://harness-hangar.vercel.app/api/mcp --header "Authorization: Bearer hk_••••"'}</pre>
                <DsCopy text="claude mcp add …" />
              </div>
              <p className="ds-small mt-4">Shown once. Hangar stores only a hash of it.</p>
            </div>

            <div className="ds-glow p-7">
              <span className="ds-label">Make harness</span>
              <h3 className="ds-h2 mt-5">Web + lab</h3>
              <div className="mt-5 space-y-2.5">
                {[
                  ["Ask before deploying", true, false],
                  ["Verify UI in a real browser", true, false],
                  ["deny Read(./.env)", true, true],
                  ["Daily check-in hook", false, false],
                ].map(([t, on, locked]) => (
                  <label key={String(t)} className={`flex items-center gap-3 rounded-ds-md border border-hairline px-4 py-3 text-[15px] ${locked ? "text-ink-3" : ""}`}>
                    <input type="checkbox" className="ds-check" defaultChecked={Boolean(on)} disabled={Boolean(locked)} />
                    <span className={locked ? "ds-mono" : ""}>{t}</span>
                    {locked ? <span className="ds-chip ds-chip-accent ml-auto">always included</span> : null}
                  </label>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="ds-small">3 rules · 1 deny rule</span>
                <button className="ds-btn ds-btn-solid">Save harness</button>
              </div>
            </div>
          </div>
        </Section>

        {/* ================= foundations ================= */}
        <Section id="foundations" n="05" kicker="Foundations" title="Type, color, controls">
          <div className="grid grid-cols-[1.3fr_1fr] gap-4">
            <div className="ds-card ds-divide overflow-hidden">
              {[
                ["Display · Archivo Expanded 800", <span key="d" className="ds-display !text-[64px]">Liftoff</span>],
                ["H1 · Archivo 700", <span key="h" className="ds-h1 !text-[44px]">Compose a new harness</span>],
                ["Caps · Archivo Expanded", <span key="c" className="ds-caps text-[20px]">Launch sequence</span>],
                ["Lead · Instrument Sans", <span key="l" className="ds-lead">Install it into any folder with one command.</span>],
                ["Body · Instrument Sans", <span key="b">Claude keeps your skills, MCP servers and deny rules exactly as they are.</span>],
                ["Label · IBM Plex Mono", <span key="m" className="ds-label">T+ 00:00:04 · Status nominal</span>],
              ].map(([k, v]) => (
                <div key={String(k)} className="px-7 py-5">
                  <p className="ds-label mb-3">{k}</p>
                  {v}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div className="ds-card p-6">
                <p className="ds-label mb-4">Brand gradient</p>
                <div className="h-16 rounded-ds-md" style={{ background: "var(--brand)" }} />
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {["g1", "g2", "g3", "g4", "g5"].map((g) => (
                    <div key={g}>
                      <div className="h-10 rounded-ds-sm" style={{ background: `var(--${g})` }} />
                      <p className="ds-mono mt-1.5 text-[11px] text-ink-3">--{g}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ds-card p-6">
                <p className="ds-label mb-4">Surfaces & ink</p>
                <div className="grid grid-cols-4 gap-2">
                  {["canvas", "raised", "sunken", "ink", "ink-2", "ink-3", "hairline-2", "accent"].map((t) => (
                    <div key={t}>
                      <div className="h-10 rounded-ds-sm border border-hairline" style={{ background: `var(--${t})` }} />
                      <p className="ds-mono mt-1.5 text-[11px] text-ink-3">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ds-card p-6">
                <p className="ds-label mb-4">Controls</p>
                <div className="flex flex-wrap gap-2.5">
                  <button className="ds-btn ds-btn-brand">Brand</button>
                  <button className="ds-btn ds-btn-solid">Solid</button>
                  <button className="ds-btn ds-btn-glass">Glass</button>
                  <button className="ds-btn ds-btn-ghost">Ghost</button>
                  <button className="ds-btn ds-btn-danger">Delete</button>
                </div>
                <label className="ds-field mt-5">
                  <span>Harness name</span>
                  <input className="ds-input" placeholder="e.g. Web class + lab" />
                </label>
              </div>
            </div>
          </div>
        </Section>

        {/* ================= light & dark ================= */}
        <Section id="themes" n="06" kicker="Themes" title="Light & dark" lede="Light is crisp and Stripe-bright. Dark is deep space. The toggle in the top bar switches the whole site.">
          <div className="grid grid-cols-2 gap-4">
            {(["light", "dark"] as const).map((t) => (
              <div key={t} data-theme={t} className="ds ds-noise relative overflow-hidden rounded-ds-xl border border-hairline p-8">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-[70px]" style={{ background: "var(--brand)" }} aria-hidden />
                <span className="ds-label relative">{t} mode</span>
                <div className="ds-glow relative mt-5 flex flex-col gap-3 p-6">
                  <div className="flex items-start justify-between">
                    <h3 className="ds-h3">Web app</h3>
                    <span className="ds-chip ds-chip-brand">Composed</span>
                  </div>
                  <p className="ds-small">Next.js, Clerk, Supabase with RLS, real-browser checks.</p>
                  <div className="flex gap-2 pt-2">
                    <button className="ds-btn ds-btn-brand ds-btn-sm">Launch</button>
                    <button className="ds-btn ds-btn-glass ds-btn-sm">View</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </main>

      <footer className="mt-10 border-t border-hairline">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-10">
          <Wordmark />
          <span className="ds-label">Local design preview · not deployed</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- pieces ---------- */

function Section({ id, n, kicker, title, lede, children }: { id: string; n: string; kicker: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-28">
      <div className="flex items-center gap-3">
        <span className="ds-label !text-accent">{n}</span>
        <span className="h-px w-8 bg-hairline-2" />
        <span className="ds-label">{kicker}</span>
      </div>
      <h2 className="ds-h1 mt-5 max-w-[20ch]">{title}</h2>
      {lede && <p className="ds-lead mt-5 max-w-[60ch]">{lede}</p>}
      <div className="mt-14">{children}</div>
    </section>
  );
}

function Bento({ className = "", icon, title, sub, featured, compact, children }: { className?: string; icon: ReactNode; title: string; sub: string; featured?: boolean; compact?: boolean; children?: ReactNode }) {
  return (
    <div className={`ds-glow ds-lift relative overflow-hidden p-7 ${className}`}>
      {featured && <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full opacity-35 blur-[80px]" style={{ background: "var(--brand)" }} aria-hidden />}
      <span className="relative grid h-11 w-11 place-items-center rounded-ds-md border border-hairline bg-sunken text-ink">{icon}</span>
      <h3 className={`relative mt-5 ${compact ? "ds-h3 !text-[17px]" : "ds-h3"}`}>{title}</h3>
      <p className="ds-small relative mt-1">{sub}</p>
      <div className="relative">{children}</div>
    </div>
  );
}

function Wordmark({ small }: { small?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${small ? "text-[13px]" : "text-[16px]"}`}>
      <svg width={small ? 16 : 22} height={small ? 16 : 22} viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id="hg" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--g1)" />
            <stop offset="0.5" stopColor="var(--g3)" />
            <stop offset="1" stopColor="var(--g4)" />
          </linearGradient>
        </defs>
        <path d="M2 21V10.2L12 3l10 7.2V21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M7 21v-7h10v7" stroke="url(#hg)" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
      <span className="ds-caps tracking-[0.18em]">Hangar</span>
    </span>
  );
}

const ic = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const Arrow = () => (
  <svg {...ic} width={16} height={16}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const SearchIcon = () => (
  <svg {...ic} className="text-ink-3">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
const RocketIcon = ({ light }: { light?: boolean }) => (
  <svg {...ic} width={16} height={16} className={light ? "text-white" : "text-ink-2"}>
    <path d="M12 2c3 2.5 4.5 6 4 10l-2 3h-4l-2-3c-.5-4 1-7.5 4-10Z" />
    <path d="M9.5 15 7 19l3-.5M14.5 15l2.5 4-3-.5M12 21v-3" />
    <circle cx="12" cy="9" r="1.5" />
  </svg>
);
const RulesIcon = () => (
  <svg {...ic}>
    <path d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3" />
  </svg>
);
const ShieldIcon = () => (
  <svg {...ic}>
    <path d="M12 3 5 6v6c0 4 3 7.5 7 9 4-1.5 7-5 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
const BoltIcon = () => (
  <svg {...ic}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);
const PlugIcon = () => (
  <svg {...ic}>
    <path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7ZM12 17v5" />
  </svg>
);
const AgentIcon = () => (
  <svg {...ic}>
    <rect x="4" y="7" width="16" height="12" rx="3" />
    <path d="M12 3v4M9 13h.01M15 13h.01" />
  </svg>
);
const ScanIcon = () => (
  <svg {...ic}>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
  </svg>
);
