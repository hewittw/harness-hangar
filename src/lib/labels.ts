import type { PartKind } from "./harness";

export const KIND_LABEL: Record<PartKind, { one: string; many: string }> = {
  rule: { one: "rule", many: "Rules" },
  skill: { one: "skill", many: "Skills" },
  agent: { one: "subagent", many: "Subagents" },
  mcp_server: { one: "MCP server", many: "MCP servers" },
  permission: { one: "permission", many: "Permissions" },
  hook: { one: "hook", many: "Hooks" },
};

export const KIND_ORDER: PartKind[] = ["rule", "skill", "agent", "mcp_server", "permission", "hook"];
