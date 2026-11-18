import { describe, expect, it } from "vitest";
import { partInput } from "./harness";

describe("part schema blocks unsafe install paths", () => {
  const skill = (path: string, name = "ok") => ({ kind: "skill", name, content: { files: [{ path: "SKILL.md", content: "x" }, { path, content: "x" }] } });
  it.each(["../evil.sh", "/etc/passwd", "a/../../b", "a\\b"])("rejects %s", (p) => {
    expect(partInput.safeParse(skill(p)).success).toBe(false);
  });
  it("rejects names that would escape a folder", () => {
    expect(partInput.safeParse(skill("x.md", "../x")).success).toBe(false);
  });
  it("accepts nested relative paths", () => {
    expect(partInput.safeParse(skill("scripts/run.sh")).success).toBe(true);
  });
  it("requires SKILL.md in a skill", () => {
    expect(partInput.safeParse({ kind: "skill", name: "s", content: { files: [{ path: "a.md", content: "" }] } }).success).toBe(false);
  });
});
