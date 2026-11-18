import { describe, expect, it } from "vitest";
import { installHarnessPrompt, saveHarnessPrompt } from "./prompts";

describe("save-harness prompt", () => {
  const t = saveHarnessPrompt();
  it("looks for skills and MCP servers outside the project", () => {
    expect(t).toContain("~/.claude/skills/");
    expect(t).toContain("~/.claude/plugins/");
    expect(t).toContain("claude mcp list");
    expect(t).toContain('Leave out the "hangar" server itself');
  });
  it("reads Markdown for mentioned skills and asks the user about missing ones", () => {
    expect(t).toContain("skills-lock.json");
    expect(t).toContain("Are there other skills or MCP servers you use with this project that I didn't find?");
  });
  it("keeps secrets as placeholders and never opens env files", () => {
    expect(t).toContain("${VAR}");
    expect(t).toContain("Never open .env files");
  });
});

describe("install-harness prompt", () => {
  it("lists harnesses when no name is given and uses the name when it is", () => {
    expect(installHarnessPrompt()).toContain("Call list_harnesses");
    expect(installHarnessPrompt("Research papers")).toContain('get_harness with name "Research papers"');
  });
});
