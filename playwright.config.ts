import { defineConfig, devices } from "@playwright/test";
import { baseURL, port, startWebServer } from "./e2e/env";

// Tests skip themselves when the keys they need are missing (see e2e/env.ts and .env.example).
// The dev server is only started when the app has its keys and E2E_BASE_URL is not set.
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: startWebServer
    ? {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        // PORT makes siteUrl() (links on /connect and in MCP replies) point at this server.
        env: { PORT: String(port) },
        // Never reuse a server already on this port: it may be another checkout's. Use E2E_BASE_URL for that.
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : undefined,
});
