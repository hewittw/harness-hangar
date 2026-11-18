# Hangar v1 plan

**Core task:** a Claude Code user signs in, connects their Claude with one command, saves the harness from their current folder, sees it on the website, composes a new harness from parts of two saved ones, and installs it into an empty folder, where the new Claude has the right rules, skills, MCP servers and deny rules.

## In v1
1. Clerk sign-in.
2. Connect page: issue/revoke personal tokens (`hk_…`, stored as SHA-256 hashes) and show the `claude mcp add` command.
3. MCP server `/api/mcp`: tools `save_harness`, `list_harnesses`, `get_harness`, `compose_harness`; prompts `save-harness`, `install-harness`.
4. Server-side scan: rejects secrets, emails and absolute home paths, with model-readable fix instructions; size limits.
5. Supabase: `harnesses`, `harness_parts` (rule, skill, agent, mcp_server, permission, hook), `api_tokens`; RLS on all.
6. Library view: harnesses and their parts grouped by type.
7. Make harness view: checkboxes across harnesses with merge rules (all deny rules carry over; hooks picked one by one; name clashes need a choice).
8. Gates: husky pre-push + GitHub Actions `npm run check`; protected `main`.
9. Ship checklist: env-only keys, `.env` deny rule, RLS, `/security-review`.

## v2
Custom front-end design, public marketplace and sharing, skill marketplace, AI news, full in-site AI agent, OAuth instead of tokens.

## Build order
0. Scaffold, gates, repo, live Vercel URL.
1. Schema + RLS + Clerk third-party auth in Supabase.
2. MCP endpoint + token auth + `save_harness` + scan (proved by saving a real harness).
3. `list_harnesses`, `get_harness`, `install-harness` (proved by installing into an empty folder).
4. Connect page + Library view.
5. Compose: lib + tests, `compose_harness`, Make harness page.
6. Security pass, new-person run-through, README, v2 plan from user tests.
