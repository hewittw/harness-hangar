import type { PartInput } from "./harness";

/**
 * Turns a harness's parts into the files a new Claude Code project needs.
 * Pure function: the MCP's get_harness returns this tree and Claude writes it.
 */

export type InstallFile = { path: string; content: string };
export type InstallTree = { files: InstallFile[]; envVars: string[]; summary: string };

const PLACEHOLDER_G = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-[^}]*)?\}/g;

function agentsMd(name: string, description: string | undefined, rules: Extract<PartInput, { kind: "rule" }>[]): string {
  const out = [`# ${name}`, ""];
  if (description) out.push(description, "");
  out.push("<!-- Installed from Hangar. Rules are distilled: portable ideas, no project-specific paths. -->", "");
  const sections = new Map<string, string[]>();
  for (const r of rules) {
    const s = r.content.section?.trim() || "Rules";
    sections.set(s, [...(sections.get(s) ?? []), r.content.text.trim()]);
  }
  for (const [section, texts] of sections) {
    out.push(`## ${section}`, "", ...texts.map((t) => `- ${t.replace(/\n+/g, " ")}`), "");
  }
  return out.join("\n").trimEnd() + "\n";
}

export function buildInstallTree(harness: { name: string; description?: string | null; parts: PartInput[] }): InstallTree {
  const files: InstallFile[] = [];
  const by = <K extends PartInput["kind"]>(k: K) =>
    harness.parts.filter((p): p is Extract<PartInput, { kind: K }> => p.kind === k);

  const rules = by("rule");
  files.push({ path: "AGENTS.md", content: agentsMd(harness.name, harness.description ?? undefined, rules) });
  // Claude Code reads CLAUDE.md; importing AGENTS.md keeps one source of truth for other agents too.
  files.push({ path: "CLAUDE.md", content: "@AGENTS.md\n" });

  for (const s of by("skill")) {
    for (const f of s.content.files) files.push({ path: `.claude/skills/${s.name}/${f.path}`, content: f.content });
  }
  for (const a of by("agent")) files.push({ path: `.claude/agents/${a.name}.md`, content: a.content.content });

  const servers = by("mcp_server");
  if (servers.length) {
    const mcpServers = Object.fromEntries(servers.map((s) => [s.name, s.content.config]));
    files.push({ path: ".mcp.json", content: JSON.stringify({ mcpServers }, null, 2) + "\n" });
  }

  const perms = by("permission");
  const hooks = by("hook");
  if (perms.length || hooks.length) {
    const settings: Record<string, unknown> = {};
    if (perms.length) {
      const permissions: Record<string, string[]> = {};
      for (const effect of ["allow", "ask", "deny"] as const) {
        const rules = [...new Set(perms.filter((p) => p.content.effect === effect).map((p) => p.content.rule))];
        if (rules.length) permissions[effect] = rules;
      }
      settings.permissions = permissions;
    }
    if (hooks.length) {
      const byEvent: Record<string, { matcher?: string; hooks: unknown[] }[]> = {};
      for (const h of hooks) {
        const entry = { ...(h.content.matcher ? { matcher: h.content.matcher } : {}), hooks: h.content.hooks };
        (byEvent[h.content.event] ??= []).push(entry);
        for (const f of h.content.files ?? []) files.push({ path: `.claude/hooks/${f.path}`, content: f.content });
      }
      settings.hooks = byEvent;
    }
    files.push({ path: ".claude/settings.json", content: JSON.stringify(settings, null, 2) + "\n" });
  }

  const envVars = new Set<string>();
  for (const f of files) for (const m of f.content.matchAll(PLACEHOLDER_G)) envVars.add(m[1]);

  const count = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const summary = [
    count(rules.length, "rule"),
    count(by("skill").length, "skill"),
    count(by("agent").length, "subagent"),
    count(servers.length, "MCP server"),
    count(perms.length, "permission"),
    count(hooks.length, "hook"),
  ].join(", ");

  return { files, envVars: [...envVars].sort(), summary };
}
