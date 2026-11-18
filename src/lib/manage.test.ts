import { describe, expect, it } from "vitest";
import { deleteHarnessInput, harnessNameTaken, harnessNotFound, planUpdate, updateHarnessInput } from "./manage";

// Built at runtime so this file never contains a literal secret.
const fakeToken = "ghp_" + "a1B2c3D4e5".repeat(4);

describe("delete_harness input", () => {
  it("requires confirm: true", () => {
    expect(deleteHarnessInput.safeParse({ name: "web" }).success).toBe(false);
    expect(deleteHarnessInput.safeParse({ name: "web", confirm: false }).success).toBe(false);
    expect(deleteHarnessInput.safeParse({ name: "web", confirm: "yes" }).success).toBe(false);
    expect(deleteHarnessInput.safeParse({ name: "web", confirm: true }).success).toBe(true);
  });
});

describe("update_harness input", () => {
  it("applies the same limits as save_harness", () => {
    expect(updateHarnessInput.safeParse({ name: "a", new_name: "" }).success).toBe(false);
    expect(updateHarnessInput.safeParse({ name: "a", new_name: "x".repeat(81) }).success).toBe(false);
    expect(updateHarnessInput.safeParse({ name: "a", description: "x".repeat(501) }).success).toBe(false);
    expect(updateHarnessInput.safeParse({ name: "a", new_name: "b", description: "d" }).success).toBe(true);
  });
});

describe("planUpdate", () => {
  it("needs at least one of new_name and description", () => {
    const r = planUpdate({ name: "web" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/pass new_name, description, or both/);
  });

  it("rejects a rename to the same name", () => {
    const r = planUpdate({ name: "web", new_name: "web" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/same as the current name/);
  });

  it("renames, describes, or both", () => {
    expect(planUpdate({ name: "web", new_name: "web-app" })).toEqual({ ok: true, changes: { name: "web-app" } });
    expect(planUpdate({ name: "web", description: "For Next apps" })).toEqual({ ok: true, changes: { description: "For Next apps" } });
    expect(planUpdate({ name: "web", new_name: "web", description: "d" })).toEqual({ ok: true, changes: { description: "d" } });
    expect(planUpdate({ name: "web", new_name: "b", description: "d" })).toEqual({ ok: true, changes: { name: "b", description: "d" } });
  });

  it("clears the description with an empty string", () => {
    expect(planUpdate({ name: "web", description: "" })).toEqual({ ok: true, changes: { description: null } });
  });

  it("leak-scans the new name and description without echoing the secret", () => {
    const r = planUpdate({ name: "web", new_name: "web", description: `uses ${fakeToken}` });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toMatch(/^Update rejected: the leak scan found 1 issue/);
    expect(r.message).toContain("description: GitHub token");
    expect(r.message).not.toContain(fakeToken);

    const named = planUpdate({ name: "web", new_name: "from /Users/alice/stuff" });
    expect(named.ok).toBe(false);
    if (!named.ok) expect(named.message).toContain("name: home directory path");
  });

  it("does not rescan values that are not changing", () => {
    // The old name is never sent through the scan, only the new description.
    expect(planUpdate({ name: "/Users/alice", description: "fine" }).ok).toBe(true);
  });
});

describe("messages", () => {
  it("point the model at the next step", () => {
    expect(harnessNotFound("x")).toMatch(/list_harnesses/);
    expect(harnessNameTaken("x")).toMatch(/different name/);
  });
});
