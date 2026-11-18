<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Hangar

Hangar stores your Claude Code **harnesses** (instructions, memory rules, skills, MCP servers, permissions/hooks, subagents), lets you compose new ones from parts of saved ones, and installs them into new folders. The **MCP server at `/api/mcp` is the main interface**; the website is the dashboard. See `docs/PLAN.md` for scope and build order.

## Stack
Next.js 16 (App Router, `src/`), Tailwind 4, Clerk (auth), Supabase project `oyadyvzvowtfsrdxtdcb` (Postgres + RLS), Vercel Hobby, `mcp-handler` + `@modelcontextprotocol/sdk`, zod, vitest. npm, not pnpm.

## Hard rules
- Never read, print or edit `.env*` files. Keys live in env vars only (`.env.local`, Vercel). `.env.example` lists names.
- RLS stays on for every table. Browser/server-component queries use the Clerk session token; only the MCP route and server actions that need it use `SUPABASE_SECRET_KEY`, and every such query filters by `user_id`.
- The scan (`src/lib/scan.ts`) is the leak gate. Never weaken it to make an upload pass; fix the content instead.
- Logic shared by the MCP tools and the website (scan, compose, install tree) lives in `src/lib/` with unit tests.
- `npm run check` (lint, typecheck, tests, build) runs on pre-push and in CI. Work on branches; `main` is protected.
- Schema changes go in `supabase/migrations/*.sql` and are applied through the Supabase MCP.
