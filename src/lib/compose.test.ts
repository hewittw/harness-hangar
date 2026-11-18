import { describe, expect, it } from "vitest";
import { compose } from "./compose";
import type { StoredPart } from "./harness";

const A = "harness-a";
const B = "harness-b";
const parts: StoredPart[] = [
  { id: "a1", harness_id: A, kind: "rule", name: "r1", content: { text: "Ask before deploying." } },
  { id: "a2", harness_id: A, kind: "permission", name: "deny env", content: { effect: "deny", rule: "Read(./.env)" } },
  { id: "a3", harness_id: A, kind: "skill", name: "verify", content: { files: [{ path: "SKILL.md", content: "v1" }] } },
  { id: "a4", harness_id: A, kind: "permission", name: "allow npm", content: { effect: "allow", rule: "Bash(npm *)" } },
  { id: "b1", harness_id: B, kind: "rule", name: "r2", content: { text: "Write plain English." } },
  { id: "b2", harness_id: B, kind: "permission", name: "deny push", content: { effect: "deny", rule: "Bash(git push*)" } },
  { id: "b3", harness_id: B, kind: "skill", name: "verify", content: { files: [{ path: "SKILL.md", content: "v2" }] } },
  { id: "b4", harness_id: B, kind: "skill", name: "same", content: { files: [{ path: "SKILL.md", content: "s" }] } },
  { id: "a5", harness_id: A, kind: "skill", name: "same", content: { files: [{ path: "SKILL.md", content: "s" }] } },
];

describe("compose", () => {
  it("always carries every deny rule, even unselected", () => {
    const r = compose({ sourceParts: parts, selectedPartIds: ["a1", "b1"] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.parts.filter((p) => p.kind === "permission").map((p) => p.name)).toEqual(["deny env", "deny push"]);
    expect(r.autoIncluded.sort()).toEqual(["a2", "b2"]);
  });

  it("only includes unselected allow rules when picked", () => {
    const r = compose({ sourceParts: parts, selectedPartIds: ["a1"] });
    expect(r.ok && r.parts.some((p) => p.name === "allow npm")).toBe(false);
  });

  it("reports a conflict for same-name parts with different content", () => {
    const r = compose({ sourceParts: parts, selectedPartIds: ["a3", "b3"] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.conflicts).toHaveLength(1);
    expect(r.conflicts[0].key).toBe("skill:verify");
    expect(r.conflicts[0].options.map((o) => o.partId).sort()).toEqual(["a3", "b3"]);
  });

  it("uses the resolution to settle a conflict", () => {
    const r = compose({ sourceParts: parts, selectedPartIds: ["a3", "b3"], resolutions: { "skill:verify": "b3" } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const v = r.parts.find((p) => p.name === "verify");
    expect(v?.kind === "skill" && v.content.files[0].content).toBe("v2");
  });

  it("keeps identical duplicates once", () => {
    const r = compose({ sourceParts: parts, selectedPartIds: ["a5", "b4"] });
    expect(r.ok && r.parts.filter((p) => p.name === "same")).toHaveLength(1);
  });

  it("rejects unknown part ids", () => {
    const r = compose({ sourceParts: parts, selectedPartIds: ["nope"] });
    expect(!r.ok && r.unknownIds).toEqual(["nope"]);
  });

  it("orders rules first and keeps source order", () => {
    const r = compose({ sourceParts: parts, selectedPartIds: ["b1", "a1", "a5"] });
    expect(r.ok && r.parts.map((p) => p.name)).toEqual(["r1", "r2", "deny env", "deny push", "same"]);
  });

  it("never lets a same-named allow rule replace a deny rule", () => {
    const both: StoredPart[] = [
      { id: "x1", harness_id: A, kind: "permission", name: "Bash(git push:*)", content: { effect: "allow", rule: "Bash(git push:*)" } },
      { id: "y1", harness_id: B, kind: "permission", name: "Bash(git push:*)", content: { effect: "deny", rule: "Bash(git push:*)" } },
    ];
    for (const resolutions of [undefined, { "permission:Bash(git push:*)": "x1" }]) {
      const r = compose({ sourceParts: both, selectedPartIds: ["x1"], resolutions });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.parts).toEqual([{ kind: "permission", name: "Bash(git push:*)", content: { effect: "deny", rule: "Bash(git push:*)" } }]);
    }
  });
});

describe("compose: auto-included count", () => {
  it("counts a deny rule shared by two sources once", () => {
    const shared: StoredPart[] = [
      { id: "s1", harness_id: "A", kind: "permission", name: "Read(./.env)", content: { effect: "deny", rule: "Read(./.env)" } },
      { id: "s2", harness_id: "B", kind: "permission", name: "Read(./.env)", content: { effect: "deny", rule: "Read(./.env)" } },
      { id: "r1", harness_id: "A", kind: "rule", name: "r", content: { text: "x" } },
    ];
    const r = compose({ sourceParts: shared, selectedPartIds: ["r1"] });
    expect(r.ok && r.autoIncluded).toHaveLength(1);
    expect(r.ok && r.parts.filter((p) => p.kind === "permission")).toHaveLength(1);
  });
});
