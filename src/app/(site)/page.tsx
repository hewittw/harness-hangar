import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { Wordmark } from "@/components/wordmark";

const STAGES = [
  ["Connect", "One command adds Hangar to Claude Code for every folder on your computer."],
  ["Save", "In a project you like, run /mcp__hangar__save-harness. Claude distills your instructions into portable rules and keeps skills, MCP servers and deny rules."],
  ["Compose", "Pick parts from any of your harnesses. Every deny rule comes along, so a new harness is never less safe."],
  ["Launch", "In an empty folder, run /mcp__hangar__install-harness. Claude writes the whole setup and asks what the folder is for."],
] as const;

export default function Home() {
  return (
    <>
      {/* ================= hero ================= */}
      <section className="ds-noise relative flex min-h-[100svh] flex-col overflow-hidden pt-16">
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

        <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-1 flex-col justify-center px-5 pb-36 pt-16 sm:px-8 sm:pt-24">
          <div className="flex items-center gap-3">
            <span className="ds-pulse" aria-hidden />
            <span className="ds-label !text-ink-2">Harness library for Claude Code</span>
          </div>
          <h1 className="ds-display mt-7 max-w-[12ch] !text-[clamp(44px,8.4vw,124px)]">
            Launch your <span className="ds-brand-text">whole Claude.</span>
          </h1>
          <p className="ds-lead mt-7 max-w-[56ch] !text-[clamp(17px,1.8vw,21px)] !text-ink-2">
            Save the harness you already built: rules, skills, MCP servers, deny rules, hooks. Compose new ones from its parts.
            Install it into any folder with one command.
          </p>
          <Suspense fallback={<div className="mt-10 h-[52px]" />}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Show when="signed-out">
                <SignUpButton mode="modal">
                  <button className="ds-btn ds-btn-brand ds-btn-lg">
                    Get started free <Arrow />
                  </button>
                </SignUpButton>
                <a href="#how" className="ds-btn ds-btn-glass ds-btn-lg">
                  How it works
                </a>
              </Show>
              <Show when="signed-in">
                <Link href="/connect" className="ds-btn ds-btn-brand ds-btn-lg">
                  Connect Claude Code <Arrow />
                </Link>
                <Link href="/library" className="ds-btn ds-btn-glass ds-btn-lg">
                  Open your library
                </Link>
              </Show>
            </div>
          </Suspense>
        </div>

        <div className="relative z-10 border-t border-hairline">
          <div className="ds-glass">
            <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-x-6 px-5 sm:px-8 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-hairline">
              {[
                ["Commands to install", "01"],
                ["Secrets stored", "00"],
                ["Deny rules lost", "00"],
                ["Price", "$0"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-4 lg:px-6 lg:py-5 lg:first:pl-0 lg:last:pr-0">
                  <span className="ds-label">{k}</span>
                  <span className="ds-mono text-[14px] text-ink">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* ================= launch sequence ================= */}
        <Section id="how" n="01" kicker="How it works" title="Launch sequence" lede="Four stages from the setup you have to a new Claude that works the same way.">
          <div className="relative">
            <div className="absolute left-0 top-[27px] hidden h-px w-full lg:block" style={{ background: "var(--brand)", boxShadow: "0 0 18px var(--g3)", opacity: 0.85 }} aria-hidden />
            <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {STAGES.map(([t, d], i) => (
                <li key={t}>
                  <span
                    className="grid h-14 w-14 place-items-center rounded-full font-[family-name:var(--font-code)] text-[13px] text-white"
                    style={{ background: "var(--brand)", boxShadow: i === 3 ? "0 0 0 6px var(--accent-soft), 0 0 30px var(--g3)" : undefined }}
                  >
                    0{i + 1}
                  </span>
                  <p className="ds-caps mt-6 text-[22px]">{t}</p>
                  <p className="ds-small mt-2 max-w-[32ch]">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </Section>

        {/* ================= terminals ================= */}
        <Section n="02" kicker="Your terminal" title="Everything is one command away" lede="The website and Claude Code are two views of the same library. Save from one project, install into another.">
          <div className="relative grid items-center gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="pointer-events-none absolute -left-24 top-1/2 h-[380px] w-[560px] -translate-y-1/2 rounded-full opacity-35 blur-[90px]" style={{ background: "var(--brand)" }} aria-hidden />
            <Terminal title="~/web-class — claude">
              <span className="text-white/40">{"> "}</span>
              <span className="text-white">/mcp__hangar__save-harness</span>
              {"\n\n"}
              <span className="text-white/50">{"⏺ "}</span>Collected AGENTS.md, 2 skills, 1 MCP server, settings.{"\n"}
              <span className="text-white/50">{"⏺ "}</span>Distilled 32 rules. Dropped 4 project paths.{"\n"}
              {"  "}
              <span style={{ color: "var(--g1)" }}>Save as &quot;Web app&quot;?</span> <span className="text-white/40">(y/n)</span> y{"\n\n"}
              <span className="text-white/50">{"⏺ "}</span>Leak scan: <span style={{ color: "#3dd68c" }}>0 secrets · 0 emails · 0 home paths</span>
              {"\n"}
              <span style={{ color: "var(--g3)" }}>Saved.</span> <span className="text-white/50">View it in your library.</span>
            </Terminal>
            <Terminal title="~/new-project — claude">
              <span className="text-white/40">{"> "}</span>
              <span className="text-white">/mcp__hangar__install-harness</span> <span style={{ color: "var(--g1)" }}>&quot;Web app&quot;</span>
              {"\n\n"}
              <span className="text-white/50">{"⏺ "}</span>What is this folder for?{"\n"}
              <span className="text-white/40">{"> "}</span>a dashboard for my lab&apos;s experiments{"\n\n"}
              <span className="text-white/50">{"⏺ "}</span>Writing 7 files…{"\n"}
              {"  "}
              <span style={{ color: "var(--g2)" }}>✓</span> AGENTS.md <span className="text-white/35">32 rules</span>
              {"\n  "}
              <span style={{ color: "var(--g2)" }}>✓</span> .claude/settings.json <span className="text-white/35">4 deny</span>
              {"\n  "}
              <span style={{ color: "var(--g2)" }}>✓</span> .mcp.json <span className="text-white/35">needs SUPABASE_PROJECT_REF</span>
              {"\n\n"}
              <span style={{ color: "var(--g3)" }}>Launch complete.</span> <span className="text-white/50">Restart Claude Code to load it.</span>
            </Terminal>
          </div>
        </Section>

        {/* ================= bento ================= */}
        <Section n="03" kicker="What a harness is" title="Everything around the model" lede="Plugins share single pieces. Hangar keeps the whole harness, including the parts that enforce rules.">
          <div className="grid gap-4 sm:grid-cols-2 lg:auto-rows-[220px] lg:grid-cols-6">
            <Bento className="lg:col-span-3 lg:row-span-2" icon={<RulesIcon />} title="Instructions & memory" sub="Distilled into portable rules. Project details stay behind." featured>
              <div className="mt-6 space-y-2.5">
                {["Ask before deploying or spending money.", "Verify UI in a real browser at phone and desktop sizes.", "Keys live in env vars. Never print one."].map((r) => (
                  <div key={r} className="flex items-start gap-3 rounded-ds-md border border-hairline bg-canvas/60 px-4 py-3 text-[15px]">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--brand)" }} />
                    {r}
                  </div>
                ))}
              </div>
            </Bento>
            <Bento className="lg:col-span-3" icon={<ShieldIcon />} title="Permissions & hooks" sub="Kept exactly. Deny rules always carry over.">
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="ds-chip ds-chip-danger">deny Read(./.env)</span>
                <span className="ds-chip ds-chip-danger">deny git push --force</span>
                <span className="ds-chip">allow npm run *</span>
              </div>
            </Bento>
            <Bento className="lg:col-span-1" icon={<BoltIcon />} title="Skills" sub="Kept exactly." />
            <Bento className="lg:col-span-1" icon={<PlugIcon />} title="MCP" sub="Keys → ${VARS}" />
            <Bento className="lg:col-span-1" icon={<AgentIcon />} title="Subagents" sub="Kept exactly." />
            <Bento className="sm:col-span-2 lg:col-span-6" icon={<ScanIcon />} title="Leak scan on every upload" sub="Keys, tokens, emails and home-folder paths are rejected before anything is stored, with instructions Claude can follow to fix them.">
              <div className="mt-4 flex flex-wrap items-center gap-2">
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

        {/* ================= final CTA ================= */}
        <section className="pb-28">
          <div className="ds-glow ds-noise relative overflow-hidden !rounded-ds-xl px-6 py-16 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full opacity-45 blur-[90px]" style={{ background: "var(--brand)" }} aria-hidden />
            <div className="relative flex flex-col items-center">
              <Wordmark showText={false} />
              <h2 className="ds-display mt-6 !text-[clamp(34px,5vw,64px)]">Ready for liftoff</h2>
              <p className="ds-lead mx-auto mt-4 max-w-[46ch] !text-[18px]">Connect Claude Code in one command and save your first harness in about a minute.</p>
              <Suspense fallback={<div className="mt-8 h-[52px]" />}>
                <div className="mt-8">
                  <Show when="signed-out">
                    <SignUpButton mode="modal">
                      <button className="ds-btn ds-btn-brand ds-btn-lg">
                        Get started free <Arrow />
                      </button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <Link href="/connect" className="ds-btn ds-btn-brand ds-btn-lg">
                      Connect Claude Code <Arrow />
                    </Link>
                  </Show>
                </div>
              </Suspense>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function Section({ id, n, kicker, title, lede, children }: { id?: string; n: string; kicker: string; title: string; lede?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 py-20 sm:py-28">
      <div className="flex items-center gap-3">
        <span className="ds-label !text-accent">{n}</span>
        <span className="h-px w-8 bg-hairline-2" />
        <span className="ds-label">{kicker}</span>
      </div>
      <h2 className="ds-h1 mt-5 max-w-[20ch]">{title}</h2>
      {lede && <p className="ds-lead mt-5 max-w-[60ch] !text-[clamp(17px,1.8vw,21px)]">{lede}</p>}
      <div className="mt-12 sm:mt-14">{children}</div>
    </section>
  );
}

function Terminal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ds-terminal relative">
      <div className="ds-terminal-bar">
        <i style={{ background: "#ff5f57" }} />
        <i style={{ background: "#febc2e" }} />
        <i style={{ background: "#28c840" }} />
        <span className="ml-3 truncate font-[family-name:var(--font-code)] text-[12px] text-white/40">{title}</span>
      </div>
      <pre className="overflow-x-auto">{children}</pre>
    </div>
  );
}

function Bento({ className = "", icon, title, sub, featured, children }: { className?: string; icon: ReactNode; title: string; sub: string; featured?: boolean; children?: ReactNode }) {
  return (
    <div className={`ds-glow ds-lift relative overflow-hidden p-7 ${className}`}>
      {featured && <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full opacity-35 blur-[80px]" style={{ background: "var(--brand)" }} aria-hidden />}
      <span className="relative grid h-11 w-11 place-items-center rounded-ds-md border border-hairline bg-sunken text-ink">{icon}</span>
      <h3 className="ds-h3 relative mt-5">{title}</h3>
      <p className="ds-small relative mt-1">{sub}</p>
      <div className="relative">{children}</div>
    </div>
  );
}

const ic = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const Arrow = () => (
  <svg {...ic} width={16} height={16}>
    <path d="M5 12h14M13 6l6 6-6 6" />
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
