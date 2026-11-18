import { describe, expect, it } from "vitest";
import { buildInstallTree } from "./install";
import type { PartInput } from "./harness";

const parts: PartInput[] = [
  { kind: "rule", name: "r1", content: { text: "Ask before deploying.", section: "Safety" } },
  { kind: "rule", name: "r2", content: { text: "Write plain English." } },
  { kind: "skill", name: "verify", content: { files: [{ path: "SKILL.md", content: "# Verify" }, { path: "scripts/run.sh", content: "echo hi" }] } },
  { kind: "agent", name: "reviewer", content: { content: "---\nname: reviewer\n---\nReview code." } },
  { kind: "mcp_server", name: "github", content: { config: { type: "http", url: "https://api.githubcopilot.com/mcp/", headers: { Authorization: "Bearer ${GITHUB_TOKEN}" } } } },
  { kind: "permission", name: "deny env", content: { effect: "deny", rule: "Read(./.env)" } },
  { kind: "permission", name: "allow npm", content: { effect: "allow", rule: "Bash(npm *)" } },
  { kind: "hook", name: "check", content: { event: "PreToolUse", matcher: "Bash", hooks: [{ type: "command", command: "bash .claude/hooks/check.sh" }], files: [{ path: "check.sh", content: "exit 0" }] } },
];

describe("buildInstallTree", () => {
  const tree = buildInstallTree({ name: "Web Class", description: "For web projects.", parts });
  const file = (p: string) => tree.files.find((f) => f.path === p)?.content;

  it("writes every part to its Claude Code location", () => {
    expect(tree.files.map((f) => f.path).sort()).toEqual([
      ".claude/agents/reviewer.md",
      ".claude/hooks/check.sh",
      ".claude/settings.json",
      ".claude/skills/verify/SKILL.md",
      ".claude/skills/verify/scripts/run.sh",
      ".mcp.json",
      "AGENTS.md",
      "CLAUDE.md",
    ]);
  });

  it("rebuilds AGENTS.md from rules grouped by section", () => {
    const md = file("AGENTS.md")!;
    expect(md).toContain("# Web Class");
    expect(md).toContain("## Safety\n\n- Ask before deploying.");
    expect(md).toContain("## Rules\n\n- Write plain English.");
    expect(file("CLAUDE.md")).toBe("@AGENTS.md\n");
  });

  it("builds settings.json with permissions and hooks", () => {
    const s = JSON.parse(file(".claude/settings.json")!);
    expect(s.permissions).toEqual({ allow: ["Bash(npm *)"], deny: ["Read(./.env)"] });
    expect(s.hooks.PreToolUse[0].matcher).toBe("Bash");
  });

  it("lists env vars the user must set", () => {
    expect(tree.envVars).toEqual(["GITHUB_TOKEN"]);
    expect(JSON.parse(file(".mcp.json")!).mcpServers.github.url).toContain("githubcopilot");
  });

  it("summarizes the contents", () => {
    expect(tree.summary).toBe("2 rules, 1 skill, 1 subagent, 1 MCP server, 2 permissions, 1 hook");
  });
});
