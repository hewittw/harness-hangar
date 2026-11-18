import { describe, expect, it } from "vitest";
import { formatFindings, scanPart, scanParts } from "./scan";
import type { PartInput } from "./harness";

const rule = (text: string): PartInput => ({ kind: "rule", name: "r", content: { text } });
const skill = (content: string): PartInput => ({
  kind: "skill",
  name: "deploy",
  content: { files: [{ path: "SKILL.md", content }] },
});
const mcp = (config: Record<string, unknown>): PartInput => ({ kind: "mcp_server", name: "gh", content: { config } });

// Built at runtime so this file never contains a literal secret.
const fake = (prefix: string, n = 36) => prefix + "a1B2c3D4e5".repeat(Math.ceil(n / 10)).slice(0, n);

describe("scan: secrets", () => {
  it.each([
    ["GitHub token", fake("ghp_")],
    ["Anthropic API key", fake("sk-ant-api03-")],
    ["AWS access key", "AKIA" + "ABCDEFGHIJKLMNOP"],
    ["Supabase secret key", fake("sb_secret_")],
    ["Stripe/Clerk-style secret key", fake("sk_test_")],
    ["Hangar token", fake("hk_")],
    ["private key block", "-----BEGIN RSA PRIVATE KEY-----"],
    ["literal Bearer token", "Authorization: Bearer " + fake("", 40)],
  ])("flags a %s", (issue, secret) => {
    const f = scanPart(skill(`line one\nuse ${secret} here`));
    expect(f.map((x) => x.issue)).toContain(issue);
    expect(f[0].where).toBe("files/SKILL.md line 2");
  });

  it("never echoes the secret in the error message", () => {
    const secret = fake("ghp_");
    const msg = formatFindings(scanPart(skill(secret)));
    expect(msg).not.toContain(secret);
    expect(msg).toContain("Nothing was saved");
  });

  it("allows env placeholders", () => {
    expect(scanPart(skill("Authorization: Bearer ${GITHUB_TOKEN}"))).toEqual([]);
    expect(scanPart(mcp({ url: "https://x.dev/mcp?token=${HK}", headers: { Authorization: "Bearer ${HK}" } }))).toEqual([]);
  });

  it("flags literal secret-looking MCP env and headers", () => {
    const f = scanPart(mcp({ command: "npx", env: { API_KEY: "abc123", LOG_LEVEL: "debug" } }));
    expect(f).toHaveLength(1);
    expect(f[0].where).toBe("config.env.API_KEY");
    expect(f[0].fix).toContain("${API_KEY}");
  });

  it("flags credentials in URLs", () => {
    expect(scanPart(mcp({ url: "https://api.x.com/mcp?api_key=abcdefgh12345" }))[0].issue).toBe("credential in a URL");
    expect(scanPart(rule("connect to postgres://admin:hunter22@db.host/x"))[0].issue).toBe("password in a URL");
  });
});

describe("scan: personal details", () => {
  it("flags home paths on mac, linux and windows", () => {
    for (const p of ["/Users/school/Documents/x", "/home/alice/repo", "C:\\Users\\bob\\code"]) {
      expect(scanPart(rule(`files live in ${p}`))[0]?.issue).toBe("home directory path");
    }
  });

  it("allows ~, $HOME and placeholder paths", () => {
    expect(scanPart(rule("skills live in ~/.claude/skills and $HOME/.claude"))).toEqual([]);
    expect(scanPart(rule("e.g. /Users/<you>/project"))).toEqual([]);
  });

  it("flags emails but allows noreply and example addresses", () => {
    expect(scanPart(rule("email me at jane.doe@uchicago.edu"))[0].issue).toBe("email address");
    expect(scanPart(rule("Co-Authored-By: Claude <noreply@anthropic.com>"))).toEqual([]);
    expect(scanPart(rule("test user: someone@example.com"))).toEqual([]);
  });

  it("checks skill file paths and part names too", () => {
    const p: PartInput = { kind: "skill", name: "x", content: { files: [{ path: "SKILL.md", content: "ok" }, { path: "notes/jane@corp.io.md", content: "ok" }] } };
    expect(scanPart(p)[0].where).toBe("files/notes/jane@corp.io.md (path)");
  });

  it("passes a clean harness", () => {
    expect(scanParts([rule("Ask before deploying."), skill("# Deploy\nRun the deploy script.")])).toEqual([]);
  });
});

describe("scan: hardening (verify-team findings)", () => {
  it("stays fast on huge inputs (no catastrophic backtracking)", () => {
    const big = "a".repeat(200_000);
    const mixed = "a.b+c-".repeat(30_000);
    const t0 = performance.now();
    scanParts([skill(big), skill(mixed), mcp({ url: big, args: [mixed] })]);
    expect(performance.now() - t0).toBeLessThan(1500);
  });

  it("does not let a placeholder hide a literal secret", () => {
    const f = scanPart(mcp({ env: { API_KEY: "3f9a1c2b4d5e6f708192a3b4c5d6e7f8${UNUSED}" } }));
    expect(f.map((x) => x.issue)).toContain("literal value where a secret belongs");
  });

  it("flags secrets passed as CLI flags", () => {
    expect(scanPart(mcp({ command: "npx", args: ["server", "--api-key", "abcdef0123456789"] }))[0]?.issue).toBe("literal secret passed as a command-line flag");
    expect(scanPart(mcp({ command: "npx", args: ["--token=abcdef0123456789"] })).map((x) => x.issue)).toContain("literal secret passed as a command-line flag");
    expect(scanPart(mcp({ command: "npx", args: ["--api-key", "${API_KEY}"] }))).toEqual([]);
  });

  it("flags token-like URL path segments and nested env", () => {
    expect(scanPart(mcp({ url: "https://mcp.host/3f9a1c2b4d5e6f708192a3b4c5d6e7f8/sse" }))[0]?.issue).toBe("token-like segment in a URL");
    expect(scanPart(mcp({ url: "https://mcp.host/${KEY}/sse" }))).toEqual([]);
    expect(scanPart(mcp({ server: { env: { SECRET: "hunter22hunter22" } } })).length).toBeGreaterThan(0);
  });

  it("flags generic secret assignments and lowercase bearer", () => {
    expect(scanPart(rule("set DATABASE_PASSWORD=Tr0ub4dor3xyz in the shell"))[0]?.issue).toBe("secret assignment");
    expect(scanPart(rule("aws_secret_access_key = wJalrXUtnFEMIK7MDENGbPxRfiCY"))[0]?.issue).toBe("secret assignment");
    expect(scanPart(rule("authorization: bearer " + fake("", 30))).map((x) => x.issue)).toContain("literal Bearer token");
    expect(scanPart(rule("set API_KEY=${API_KEY} or API_KEY=<your-key>"))).toEqual([]);
  });

  it("scans the harness name and description", async () => {
    const { scanHarnessMeta } = await import("./scan");
    const f = scanHarnessMeta({ name: "Web", description: `deploy with ${fake("sk-ant-api03-")}, ping alice@gmail.com` });
    expect(f.map((x) => x.issue).sort()).toEqual(["Anthropic API key", "email address"]);
    expect(f[0].part).toBe("the harness");
    expect(scanHarnessMeta({ name: "Web class", description: "For Next.js projects." })).toEqual([]);
  });
});
