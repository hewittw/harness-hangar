import type { PartInput } from "../harness";

/** Small builders so the pack files read like content, not JSON. */

export const rule = (name: string, section: string, text: string): PartInput => ({
  kind: "rule",
  name,
  content: { section, text },
});

/** A skill with a single SKILL.md: YAML frontmatter, a title, numbered steps and optional notes. */
export function skill(
  name: string,
  description: string,
  title: string,
  steps: string[],
  notes: string[] = [],
): PartInput {
  const body = [
    "---",
    `name: ${name}`,
    `description: ${description}`,
    "---",
    "",
    `# ${title}`,
    "",
    ...steps.map((s, i) => `${i + 1}. ${s}`),
    ...(notes.length ? ["", "## Notes", "", ...notes.map((n) => `- ${n}`)] : []),
    "",
  ].join("\n");
  return { kind: "skill", name, content: { files: [{ path: "SKILL.md", content: body }] } };
}

const permission =
  (effect: "allow" | "deny" | "ask") =>
  (rule: string): PartInput => ({ kind: "permission", name: `${effect} ${rule}`, content: { effect, rule } });

export const allow = permission("allow");
export const deny = permission("deny");
export const ask = permission("ask");

/** Every starter harness keeps env files out of reach. */
export const envDenies = (): PartInput[] => [deny("Read(./.env)"), deny("Read(./.env.*)")];

/**
 * Formats each file Claude edits. Hooks get the tool call as JSON on stdin, so jq pulls out the path.
 * --ignore-unknown keeps it quiet on files Prettier doesn't handle.
 */
export const prettierHook = (): PartInput => ({
  kind: "hook",
  name: "format-on-edit",
  content: {
    event: "PostToolUse",
    matcher: "Edit|MultiEdit|Write",
    hooks: [
      {
        type: "command",
        command: `jq -r '.tool_input.file_path // empty' | xargs -r -I{} npx prettier --write --ignore-unknown "{}"`,
        timeout: 30,
      },
    ],
  },
});

/** Well-known MCP servers. Secrets are always ${VAR} placeholders. */
export const mcp = {
  github: (): PartInput => ({
    kind: "mcp_server",
    name: "github",
    content: {
      config: {
        type: "http",
        url: "https://api.githubcopilot.com/mcp/",
        headers: { Authorization: "Bearer ${GITHUB_TOKEN}" },
      },
    },
  }),
  linear: (): PartInput => ({
    kind: "mcp_server",
    name: "linear",
    content: { config: { type: "http", url: "https://mcp.linear.app/mcp" } },
  }),
  notion: (): PartInput => ({
    kind: "mcp_server",
    name: "notion",
    content: { config: { type: "http", url: "https://mcp.notion.com/mcp" } },
  }),
  playwright: (): PartInput => ({
    kind: "mcp_server",
    name: "playwright",
    content: { config: { command: "npx", args: ["@playwright/mcp@latest"] } },
  }),
  figma: (): PartInput => ({
    kind: "mcp_server",
    name: "figma-dev-mode",
    content: { config: { type: "http", url: "http://127.0.0.1:3845/mcp" } },
  }),
  sentry: (): PartInput => ({
    kind: "mcp_server",
    name: "sentry",
    content: { config: { type: "http", url: "https://mcp.sentry.dev/mcp" } },
  }),
  vercel: (): PartInput => ({
    kind: "mcp_server",
    name: "vercel",
    content: { config: { type: "http", url: "https://mcp.vercel.com" } },
  }),
};
