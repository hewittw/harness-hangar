import { describe, expect, it } from "vitest";
import { harnessInput, type HarnessInput } from "../harness";
import { buildInstallTree } from "../install";
import { scanHarnessMeta, scanParts } from "../scan";
import { getStarterPack, STARTER_PACKS } from "./index";

const allHarnesses = STARTER_PACKS.flatMap((p) => p.harnesses.map((h) => [`${p.id} / ${h.name}`, h] as const));

const count = (h: HarnessInput, kind: HarnessInput["parts"][number]["kind"]) =>
  h.parts.filter((p) => p.kind === kind).length;

describe("starter packs", () => {
  it("has the five packs in order, with unique ids", () => {
    expect(STARTER_PACKS.map((p) => p.id)).toEqual(["builder", "design", "family", "student", "founder"]);
    expect(new Set(STARTER_PACKS.map((p) => p.id)).size).toBe(STARTER_PACKS.length);
  });

  it.each(STARTER_PACKS.map((p) => [p.id, p] as const))("%s has 3 harnesses with unique names", (_, pack) => {
    expect(pack.harnesses).toHaveLength(3);
    expect(new Set(pack.harnesses.map((h) => h.name)).size).toBe(3);
    expect(pack.icon).toBe(pack.id);
    expect(getStarterPack(pack.id)).toBe(pack);
  });
});

describe.each(allHarnesses)("harness %s", (_, harness) => {
  it("matches the save_harness input schema", () => {
    const r = harnessInput.safeParse(harness);
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues, null, 2)).toBe(true);
  });

  it("passes the leak scan with zero findings", () => {
    expect(scanHarnessMeta(harness)).toEqual([]);
    expect(scanParts(harness.parts)).toEqual([]);
  });

  it("has no duplicate kind:name keys", () => {
    const keys = harness.parts.map((p) => `${p.kind}:${p.name}`);
    expect(keys.filter((k, i) => keys.indexOf(k) !== i)).toEqual([]);
  });

  it("has at least one deny rule, including the env files", () => {
    const denies = harness.parts.flatMap((p) =>
      p.kind === "permission" && p.content.effect === "deny" ? [p.content.rule] : [],
    );
    expect(denies).toEqual(expect.arrayContaining(["Read(./.env)", "Read(./.env.*)"]));
  });

  it("keeps the agreed shape", () => {
    expect(harness.description).toBeTruthy();
    expect(count(harness, "rule")).toBeGreaterThanOrEqual(6);
    expect(count(harness, "rule")).toBeLessThanOrEqual(12);
    expect(count(harness, "skill")).toBeGreaterThanOrEqual(1);
    expect(count(harness, "skill")).toBeLessThanOrEqual(3);
    expect(count(harness, "permission")).toBeGreaterThanOrEqual(2);
    expect(count(harness, "permission")).toBeLessThanOrEqual(5);
    expect(count(harness, "hook")).toBeLessThanOrEqual(1);
    expect(count(harness, "mcp_server")).toBeLessThanOrEqual(2);
    expect(JSON.stringify(harness).length).toBeLessThan(50_000);
    for (const p of harness.parts) {
      if (p.kind === "rule") expect(p.content.section, p.name).toBeTruthy();
      if (p.kind === "permission") expect(p.name).toBe(`${p.content.effect} ${p.content.rule}`);
    }
  });

  it("gives every skill a SKILL.md with name and description frontmatter", () => {
    for (const p of harness.parts) {
      if (p.kind !== "skill") continue;
      expect(p.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      const md = p.content.files.find((f) => f.path === "SKILL.md")?.content ?? "";
      const m = /^---\nname: (.+)\ndescription: (.+)\n---\n/.exec(md);
      expect(m, p.name).not.toBeNull();
      expect(m![1]).toBe(p.name);
      // A ": " inside an unquoted YAML value would break the frontmatter.
      expect(m![2], p.name).not.toContain(": ");
    }
  });

  it("installs with an AGENTS.md", () => {
    const tree = buildInstallTree(harness);
    const agents = tree.files.find((f) => f.path === "AGENTS.md");
    expect(agents?.content).toContain(`# ${harness.name}`);
    expect(tree.files.some((f) => f.path === ".claude/settings.json")).toBe(true);
  });
});

describe("preinstalled basics", () => {
  it("resolves all four basics from the packs", async () => {
    const { BASICS } = await import("../server/seed-config");
    const { STARTER_PACKS } = await import("./index");
    for (const [packId, name] of BASICS) {
      expect(STARTER_PACKS.find((p) => p.id === packId)?.harnesses.some((h) => h.name === name), `${packId}/${name}`).toBe(true);
    }
    expect(BASICS).toHaveLength(4);
  });
});
