import { expect, test } from "@playwright/test";
import { skipNoServer } from "./env";

test.describe("signed out", () => {
  test.skip(!!skipNoServer, skipNoServer);

  test("visiting /library sends you to sign-in", async ({ page }) => {
    await page.goto("/library");
    // Local sign-in page (NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in) or Clerk's hosted Account Portal.
    await expect(page).toHaveURL(/\/sign-in|accounts\.dev/);
  });

  test("MCP rejects a missing or unknown token with 401", async ({ request }) => {
    const body = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "hangar-e2e", version: "0.0.0" } } };
    const headers = { "Content-Type": "application/json", Accept: "application/json, text/event-stream" };

    const none = await request.post("/api/mcp", { headers, data: body });
    expect(none.status()).toBe(401);

    // Well-formed but never issued, so the lookup runs against the database and finds nothing.
    const unknown = await request.post("/api/mcp", {
      headers: { ...headers, Authorization: `Bearer hk_${"x".repeat(32)}` },
      data: body,
    });
    expect(unknown.status()).toBe(401);
    expect((await unknown.json()).error.code).toBe(-32001);
  });
});
