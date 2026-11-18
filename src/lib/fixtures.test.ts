import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { compose } from "./compose";
import { harnessInput, type HarnessInput, type StoredPart } from "./harness";
import { buildInstallTree } from "./install";
import { scanParts } from "./scan";

/** Real harnesses, distilled the way the save-harness prompt describes. */
const FIXTURES = ["hw5-harness.json", "hw6-harness.json"] as const;

const load = (file: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${file}`, import.meta.url), "utf8"));

const parsed = Object.fromEntries(FIXTURES.map((f) => [f, harnessInput.parse(load(f))])) as Record<
  (typeof FIXTURES)[number],
  HarnessInput
>;

const denyRules = (h: HarnessInput) =>
  h.parts.flatMap((p) => (p.kind === "permission" && p.content.effect === "deny" ? [p.content.rule] : []));

describe.each(FIXTURES)("fixture %s", (file) => {
  it("matches the save_harness input schema", () => {
    const r = harnessInput.safeParse(load(file));
    expect(r.success, r.success ? "" : JSON.stringify(r.error.issues, null, 2)).toBe(true);
  });

  it("passes the leak scan with zero findings", () => {
    expect(scanParts(parsed[file].parts)).toEqual([]);
  });

  it("has at least one deny rule", () => {
    expect(denyRules(parsed[file]).length).toBeGreaterThan(0);
  });
});

describe("composing the two fixtures", () => {
  const [a, b] = FIXTURES.map((f) => parsed[f]);
  const sourceParts: StoredPart[] = [
    ...a.parts.map((p, i) => ({ ...p, id: `a${i}`, harness_id: "a" }) as StoredPart),
    ...b.parts.map((p, i) => ({ ...p, id: `b${i}`, harness_id: "b" }) as StoredPart),
  ];
  // Pick every rule and skill from both; deny rules must come along on their own.
  const selectedPartIds = sourceParts.filter((p) => p.kind === "rule" || p.kind === "skill").map((p) => p.id);
  const result = compose({ sourceParts, selectedPartIds });

  it("composes without conflicts", () => {
    expect(result.ok, JSON.stringify(result)).toBe(true);
  });

  it("installs an AGENTS.md and a settings.json with every deny rule from both", () => {
    if (!result.ok) throw new Error("compose failed");
    const tree = buildInstallTree({ name: "Composed", description: "Both fixtures.", parts: result.parts });
    const file = (p: string) => tree.files.find((f) => f.path === p)?.content;

    const agents = file("AGENTS.md");
    expect(agents).toBeDefined();
    expect(agents).toContain("# Composed");

    const settings = JSON.parse(file(".claude/settings.json") ?? "{}");
    const expected = [...new Set([...denyRules(a), ...denyRules(b)])];
    expect(expected.length).toBeGreaterThan(0);
    expect([...settings.permissions.deny].sort()).toEqual(expected.sort());
  });
});
