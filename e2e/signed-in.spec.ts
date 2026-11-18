import { expect, test, type Page } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { baseURL, skipNoRls, skipNoSignIn, USER_A_EMAIL, USER_B_EMAIL } from "./env";
import { clerkUserClient, ensureClerkUser, mcpSession, serviceClient } from "./helpers";

// One signed-in browser page shared by the tests below, which run in order:
// the token made on /connect is used by the MCP test.
test.describe.serial("signed in as test user A", () => {
  test.skip(!!skipNoSignIn, skipNoSignIn);

  const tokenLabel = `e2e ${Date.now()}`;
  let page: Page;
  let userA: string;
  let token: string | undefined;

  test.beforeAll(async ({ browser }) => {
    await ensureClerkUser(USER_A_EMAIL);
    page = await browser.newPage({ baseURL });
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: USER_A_EMAIL });
    userA = await page.evaluate(() => window.Clerk.user!.id);
  });

  test.afterAll(async () => {
    await page?.close();
    // Remove the token this run created, when we have the key to do so.
    if (!skipNoRls && userA) await serviceClient().from("api_tokens").delete().eq("user_id", userA).eq("label", tokenLabel);
  });

  test("/connect makes a token and shows the claude mcp add command", async () => {
    await page.goto("/connect");
    await expect(page.getByRole("heading", { name: "Connect Claude Code" })).toBeVisible();
    await page.getByLabel(/Name it after the computer/).fill(tokenLabel);
    await page.getByRole("button", { name: /Make token and show command/ }).click();

    const command = page.locator("pre", { hasText: "claude mcp add" });
    await expect(command).toBeVisible();
    const text = await command.innerText();
    expect(text).toContain("--transport http");
    expect(text).toContain("/api/mcp");
    token = text.match(/Bearer (hk_[A-Za-z0-9]{32})/)?.[1];
    expect(token, "command should include the new hk_ token").toBeTruthy();
  });

  test("RLS: user B's harnesses are invisible to A and A cannot write as B", async () => {
    test.skip(!!skipNoRls, skipNoRls);

    const userB = await ensureClerkUser(USER_B_EMAIL);
    expect(userB).not.toBe(userA);
    const svc = serviceClient();
    // A's Clerk session token, fetched fresh from the signed-in page for each request (it expires in 60s).
    const asA = clerkUserClient(() => page.evaluate(async () => (await window.Clerk.session?.getToken()) ?? null));

    const name = `e2e-rls-${Date.now()}`;
    const cleanup: string[] = [];
    try {
      // B's rows, made with the service role (bypasses RLS).
      const bHarness = await svc.from("harnesses").insert({ user_id: userB, name, description: "e2e: owned by B" }).select("id").single();
      expect(bHarness.error).toBeNull();
      const bId = bHarness.data!.id as string;
      cleanup.push(bId);
      const bPart = await svc
        .from("harness_parts")
        .insert({ harness_id: bId, user_id: userB, kind: "rule", name: "e2e-rule", content: { text: "e2e rule" } })
        .select("id")
        .single();
      expect(bPart.error).toBeNull();

      // Control: A's token is accepted (otherwise the checks below would pass trivially as anon).
      // Harness rows are server-written only (migration restrict_direct_writes), so A's own row is made with the
      // service role too, and A must be able to read it.
      const own = await svc.from("harnesses").insert({ user_id: userA, name: `${name}-own` }).select("id").single();
      expect(own.error).toBeNull();
      const ownId = own.data!.id as string;
      cleanup.push(ownId);
      const ownRead = await asA.from("harnesses").select("id, user_id").eq("id", ownId);
      expect(ownRead.error).toBeNull();
      expect(ownRead.data).toEqual([{ id: ownId, user_id: userA }]);

      // Direct writes are refused even for A's own rows: only the server (which leak-scans) may write harnesses.
      const ownInsert = await asA.from("harnesses").insert({ name: `${name}-direct` });
      expect(ownInsert.error?.code).toBe("42501");
      const ownUpdate = await asA.from("harnesses").update({ description: "direct edit" }).eq("id", ownId);
      expect(ownUpdate.error?.code).toBe("42501");

      // Reads: B's rows are invisible.
      const byId = await asA.from("harnesses").select("id").eq("id", bId);
      expect(byId.error).toBeNull();
      expect(byId.data).toEqual([]);
      const byUser = await asA.from("harnesses").select("id").eq("user_id", userB);
      expect(byUser.data).toEqual([]);
      const parts = await asA.from("harness_parts").select("id").eq("harness_id", bId);
      expect(parts.data).toEqual([]);

      // Writes: inserting with B's user_id, or into B's harness, is rejected.
      const forged = await asA.from("harnesses").insert({ user_id: userB, name: `${name}-forged` });
      expect(forged.error?.code).toBe("42501");
      const forgedPart = await asA
        .from("harness_parts")
        .insert({ harness_id: bId, kind: "rule", name: "e2e-forged", content: { text: "forged" } });
      expect(forgedPart.error?.code).toBe("42501");

      // Updates and deletes of B's row touch nothing.
      const upd = await asA.from("harnesses").update({ description: "changed by A" }).eq("id", bId).select("id");
      expect(upd.data ?? []).toEqual([]);
      const del = await asA.from("harnesses").delete().eq("id", bId).select("id");
      expect(del.data ?? []).toEqual([]);

      // Confirm with the service role: B's row is untouched and nothing forged landed.
      const after = await svc.from("harnesses").select("description").eq("id", bId).single();
      expect(after.data?.description).toBe("e2e: owned by B");
      const forgedRows = await svc.from("harnesses").select("id").in("name", [`${name}-forged`, `${name}-direct`]);
      expect(forgedRows.data).toEqual([]);
      const forgedParts = await svc.from("harness_parts").select("id").eq("harness_id", bId).eq("name", "e2e-forged");
      expect(forgedParts.data).toEqual([]);
    } finally {
      if (cleanup.length) await svc.from("harnesses").delete().in("id", cleanup); // parts cascade
    }
  });

  test("MCP list_harnesses works with the token from /connect", async ({ request }) => {
    expect(token, "the /connect test must have produced a token").toBeTruthy();
    const mcp = await mcpSession(request, token!);
    expect(mcp.init.result).toBeTruthy();

    const { status, reply } = await mcp.callTool("list_harnesses");
    expect(status).toBe(200);
    expect(reply.error).toBeUndefined();
    const result = reply.result as { isError?: boolean; content: { type: string; text: string }[] };
    expect(result.isError ?? false).toBe(false);
    expect(result.content[0]?.type).toBe("text");
  });
});
