# Hangar

Hangar stores your Claude Code harnesses so you can reuse them. A harness is everything around the model in a project: rules from CLAUDE.md and memory, skills, subagents, MCP servers, permissions and hooks. You save a harness from a project you like, mix parts of saved harnesses into a new one, and install it into a new folder. Claude Code talks to Hangar through an MCP server. The website is where you sign in, make tokens, browse your library and compose.

Live: https://harness-hangar.vercel.app

## How to use it

1. **Connect.** Sign in and open `/connect`. Make a token. The page shows the command to run once in your terminal:

   ```bash
   claude mcp add --transport http --scope user hangar https://harness-hangar.vercel.app/api/mcp --header "Authorization: Bearer hk_..."
   ```

   The token is shown only once. `--scope user` makes Hangar available in every folder. Run `/mcp` in Claude Code to check that `hangar` is connected.

2. **Save.** In a project whose setup you like, run `/mcp__hangar__save-harness`. Claude collects the harness, turns CLAUDE.md, AGENTS.md and memory into short portable rules, shows you what will be uploaded, and calls `save_harness` after you confirm.

3. **Compose.** Make a new harness from parts of saved ones. Use the `/make` page, or ask Claude to use the `compose_harness` tool. Every deny permission from each source harness is always included. If two sources have a part with the same kind and name but different contents, you pick which one to keep.

4. **Install.** In an empty folder, run `/mcp__hangar__install-harness` (optionally with a harness name). Claude calls `get_harness`, which returns the files to write: `AGENTS.md`, `CLAUDE.md`, `.claude/skills/`, `.claude/agents/`, `.claude/settings.json`, `.mcp.json` and any hook scripts. Claude asks before overwriting files, then tells you which env vars to set. Restart Claude Code so the new setup loads.

MCP tools: `save_harness`, `list_harnesses`, `get_harness`, `compose_harness`, `update_harness` (rename or change the description), `delete_harness` (needs `confirm: true`, and Claude asks you first). MCP prompts: `save-harness`, `install-harness`.

## Architecture

```
Claude Code
   |  HTTP, Authorization: Bearer hk_...
   v
/api/mcp  (src/app/api/mcp/route.ts)
   |  token hashed and looked up in api_tokens -> Clerk user id
   v
src/lib: scan.ts (leak scan), compose.ts (merge rules), install.ts (file tree)
   |
   v
src/lib/server/store.ts  (service-role client, every query filtered by user_id)
   |
   v
Supabase Postgres  (RLS on harnesses, harness_parts, api_tokens)
   ^
   |  Clerk session token (RLS applies)
   |
Pages: /connect, /library, /make  (src/lib/server/user-db.ts)
   ^
   |  Clerk sign-in (src/proxy.ts runs clerkMiddleware; /api/mcp is skipped)
   |
Browser
```

Notes:

- Pages read data with the signed-in user's Clerk session token, so RLS applies.
- Making and revoking tokens and deleting harnesses also go through the Clerk session token.
- Signed-in users cannot insert or update harness rows directly. Only the server writes them, after the leak scan.
- The compose action on `/make` uses the same `store.ts` code as the MCP tool. That code uses the service-role key and filters every query by the Clerk user id.
- Install writes nothing on the server. `get_harness` returns a file tree and Claude writes the files locally.

## Local development

Copy `.env.example` to `.env.local` and fill in the values. Variable names:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

Optional: `NEXT_PUBLIC_SITE_URL` sets the origin used in links the MCP tools return. Without it, preview deployments use their own branch URL, production uses Vercel's production URL, and local dev uses `http://localhost:$PORT` (default 3000).

Supabase needs Clerk set up as a third-party auth provider so RLS can read the Clerk user id (`auth.jwt() ->> 'sub'`). The schema is in `supabase/migrations/`.

```bash
npm install
npm run dev     # http://localhost:3000
npm run check   # lint, typecheck, tests, build
```

### End-to-end tests

```bash
npx playwright install chromium   # once
npm run e2e:users                 # once: creates the Clerk test users, prints their ids
npm run test:e2e                  # starts `next dev` on port 3100 (E2E_PORT) and runs e2e/
```

The tests use the keys in `.env.local` and skip themselves when keys are missing. Sign-in tests need Clerk development-instance keys. Global setup signs test user A in once and saves the browser state to `playwright/.clerk/` (git-ignored), and later runs reuse it while the session lasts, because Clerk rate-limits sign-ins. The RLS test writes rows to the real Supabase project and deletes them afterwards, even when it fails. Set `E2E_BASE_URL` to test an app that is already running instead.

## Quality gates

- **Pre-push hook.** Husky runs `npm run check` before every `git push`. A failing check blocks the push.
- **CI.** `.github/workflows/check.yml` runs on every pull request and on pushes to `main`. It uses Node 22, runs `npm ci`, then `npm run check`.
- **Protected `main`.** The `check` job must pass, and the branch must be up to date with `main`, before changes land. Force pushes and deleting `main` are blocked.

`npm run check` runs `eslint`, `next typegen && tsc --noEmit`, `vitest run` and `next build`. Unit tests cover the scan, compose, install tree, harness schema and tokens.

## Security

- **Hashed tokens.** Tokens look like `hk_` plus 32 random characters. Hangar stores only a SHA-256 hash and a short prefix for display (`src/lib/tokens.ts`). The full token is shown once. Revoked tokens stop working. Each user can have at most 10 active tokens.
- **Leak scan before save.** Every upload goes through `src/lib/scan.ts` before it reaches the database. It rejects API keys and tokens (Anthropic, OpenAI, GitHub, AWS, Slack, Stripe/Clerk, Supabase, Google, Hangar), private keys, JWTs, literal Bearer tokens, credentials in URLs, email addresses and home-directory paths. The harness name and description are scanned too. In MCP server configs, values under secret-looking keys, `env` and `headers` values that look like tokens, values after secret-looking CLI flags, and token-like URL segments must be `${VAR}` placeholders. The error tells Claude what to fix and never repeats the secret. Size limits also apply.
- **Abuse limits in Postgres.** Each token gets 120 MCP requests per minute (HTTP 429 with a retry hint after that). Each user gets 60 saves or composes per hour and 20 MB of stored harness parts. Counters live in the `usage_counters` table and are bumped by the `hangar_rate_check` database function, so they hold across serverless instances.
- **RLS on every table.** `harnesses`, `harness_parts` and `api_tokens` have row level security. Each policy limits rows to the Clerk user id in the JWT. Signed-in users can read their own harnesses and delete them, but cannot insert or update them; only the server writes harness rows. Token rows can be created and revoked, but a token's hash and owner can't be changed.
- **Secret key stays on the server.** `SUPABASE_SECRET_KEY` is read only in `src/lib/server/admin.ts`, which imports `server-only`. Code that uses it filters every query by the user id. The `save_harness` database function can only be called by the service role.
- **`.env` deny rule.** This repo's `.claude/settings.json` denies Claude Code reading or editing `.env` files. The save prompt also tells Claude never to open `.env*` files. Installed harnesses get deny rules only if a source harness had them; Hangar does not add one by default.
- **Keys live in env vars only.** `.env*` files are git-ignored, except `.env.example`, which has names and no secrets.

## Docs

- `docs/PLAN.md`: v1 scope and build order.
- `docs/V2-PLAN.md`: what to fix and add next, based on user tests.
