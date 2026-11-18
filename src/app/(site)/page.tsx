import Link from "next/link";
import { Suspense } from "react";
import { Show, SignUpButton } from "@clerk/nextjs";

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Sign in and copy one command into your terminal. Your Claude Code can now talk to Hangar from any folder.",
  },
  {
    n: "02",
    title: "Save",
    body: "In a project you like, run /mcp__hangar__save-harness. Claude distills your instructions and memory into portable rules, keeps your skills, MCP servers and deny rules, and Hangar scans it for leaks.",
  },
  {
    n: "03",
    title: "Compose",
    body: "Pick parts from any of your harnesses (rules from one, skills from another) and make a new one. Deny rules always come along.",
  },
  {
    n: "04",
    title: "Launch",
    body: "In a new, empty folder, run /mcp__hangar__install-harness. Claude writes the whole setup and asks what the folder is for.",
  },
];

const PARTS = [
  ["Instructions", "AGENTS.md / CLAUDE.md", "Distilled into rules"],
  ["Memory", "~/.claude/…/memory", "Rules travel, project details stay"],
  ["Skills", ".claude/skills/", "Kept exactly"],
  ["MCP servers", ".mcp.json", "Kept, keys become ${VARS}"],
  ["Permissions & hooks", ".claude/settings.json", "Kept exactly"],
  ["Subagents", ".claude/agents/", "Kept exactly"],
];

export default function Home() {
  return (
    <>
      <section className="border-b border-line pb-14 pt-20 sm:pt-24">
        <p className="eyebrow">
          <span className="idx">●</span> Harness library · v1
        </p>
        <h1 className="h-hero mb-7 mt-5">
          Your whole Claude.
          <br />
          Ready to launch.
        </h1>
        <p className="max-w-[740px] text-[clamp(18px,1.9vw,23px)] leading-[1.45]">
          A month of work with Claude leaves behind rules you learned the hard
          way, skills you wrote and MCP servers you set up. Hangar saves that
          whole harness, lets you mix parts of it into new ones, and installs it
          into any new folder.
        </p>
        <Suspense fallback={<div className="mt-9 h-[42px]" />}>
          <div className="mt-9 flex flex-wrap gap-3">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <button className="btn">Get started</button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/library" className="btn no-underline">
                Open your library
              </Link>
              <Link href="/connect" className="btn btn-ghost no-underline">
                Connect Claude Code
              </Link>
            </Show>
          </div>
        </Suspense>
      </section>

      <section className="border-b border-line py-16">
        <p className="eyebrow">
          <span className="idx">02</span> How it works
        </p>
        <h2 className="h-sec mb-8 mt-3.5">Connect. Save. Compose. Launch.</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="card flex flex-col gap-3 p-6">
              <span className="label !text-ign">{s.n}</span>
              <span className="h-card">{s.title}</span>
              <p className="text-[14px] text-dim">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-16">
        <p className="eyebrow">
          <span className="idx">03</span> What a harness is
        </p>
        <h2 className="h-sec mb-4 mt-3.5">Everything around the model</h2>
        <p className="lede mb-8">
          Plugins share single pieces. Hangar keeps the whole harness, including
          the parts that enforce rules, like your deny lists and hooks.
        </p>
        <div className="card divide-y divide-line">
          {PARTS.map(([name, where, how]) => (
            <div
              key={name}
              className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-[1.1fr_1fr_1.2fr] sm:items-center"
            >
              <span className="h-card !text-[17px]">{name}</span>
              <code className="font-mono text-[12.5px] text-dim">{where}</code>
              <span className="text-[14px]">{how}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
