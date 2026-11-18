import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { harnessInput, PART_KINDS, type PartKind } from "@/lib/harness";
import { buildInstallTree } from "@/lib/install";
import { installHarnessPrompt, saveHarnessPrompt } from "@/lib/prompts";
import { siteUrl } from "@/lib/site";
import { authenticateToken, composeAndSave, getHarness, listHarnesses, saveHarness } from "@/lib/server/store";
import { underRateLimit } from "@/lib/server/usage";
import { rateLimitedBody, secondsUntilReset } from "@/lib/limits";

export const maxDuration = 60;

type Ctx = { http?: { authInfo?: { clientId?: string } } };
type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const text = (t: string): ToolResult => ({ content: [{ type: "text", text: t }] });
const fail = (t: string): ToolResult => ({ content: [{ type: "text", text: t }], isError: true });

function userOf(ctx: unknown): string {
  const id = (ctx as Ctx).http?.authInfo?.clientId;
  if (!id) throw new Error("unauthenticated"); // unreachable: the route rejects requests without a valid token
  return id;
}

const KIND_LABEL: Record<PartKind, string> = {
  rule: "rules",
  skill: "skills",
  agent: "subagents",
  mcp_server: "MCP servers",
  permission: "permissions",
  hook: "hooks",
};

const countsLine = (counts: Record<PartKind, number>) =>
  PART_KINDS.filter((k) => counts[k]).map((k) => `${counts[k]} ${KIND_LABEL[k]}`).join(", ") || "empty";

const harnessUrl = (id: string) => `${siteUrl()}/library/${id}`;

/** Any unexpected error becomes a fixed, model-readable message; details stay in the server log. */
function safe<A extends unknown[]>(fn: (...args: A) => Promise<ToolResult>): (...args: A) => Promise<ToolResult> {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error("mcp tool failed", e);
      return fail("Hangar hit an internal error and nothing was changed. Try again in a minute; if it keeps failing, tell the user.");
    }
  };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "save_harness",
      {
        title: "Save harness",
        description:
          "Save a Claude Code harness (rules, skills, subagents, MCP servers, permissions, hooks) to the user's Hangar library. " +
          "Use the save-harness prompt's steps first: distill instructions and memory into portable rules, strip secrets and personal details, and get the user's confirmation. " +
          "Hangar scans every upload and rejects anything with secrets, emails or home-directory paths, explaining what to fix.",
        inputSchema: harnessInput.extend({
          replace: z.boolean().optional().describe("Replace an existing harness with the same name. Only after the user agrees."),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      },
      safe(async ({ replace, ...input }, ctx) => {
        const r = await saveHarness(userOf(ctx), input, { replace });
        if (!r.ok) return fail(r.message);
        return text(
          `${r.value.replaced ? "Replaced" : "Saved"} harness "${input.name}" with ${input.parts.length} parts. View it at ${harnessUrl(r.value.id)}`,
        );
      }),
    );

    server.registerTool(
      "list_harnesses",
      {
        title: "List harnesses",
        description: "List the harnesses in the user's Hangar library, newest first, with what each contains.",
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      safe(async (ctx) => {
        const list = await listHarnesses(userOf(ctx));
        if (!list.length) return text("The library is empty. Use the save-harness prompt in a project folder to save the first harness.");
        return text(
          list
            .map((h) => `- ${h.name}${h.source === "compose" ? " (composed)" : ""}: ${h.description ?? "no description"} [${countsLine(h.counts)}]`)
            .join("\n"),
        );
      }),
    );

    server.registerTool(
      "get_harness",
      {
        title: "Get harness",
        description:
          "Get one harness by name. view 'install' (default) returns the exact files to write into a new project folder plus the env vars the user must set; " +
          "view 'parts' lists its parts as kind:name keys, for choosing parts in compose_harness.",
        inputSchema: z.object({
          name: z.string().describe("Harness name, as shown by list_harnesses."),
          view: z.enum(["install", "parts"]).optional(),
        }),
        annotations: { readOnlyHint: true, openWorldHint: false },
      },
      safe(async ({ name, view }, ctx) => {
        const h = await getHarness(userOf(ctx), { name });
        if (!h) return fail(`No harness named "${name}". Call list_harnesses to see the exact names.`);
        if (view === "parts") {
          return text(
            [`Parts of "${h.name}" (use these kind:name keys in compose_harness):`, ...h.parts.map((p) => {
              const preview = p.kind === "rule" ? `: ${p.content.text}` : p.kind === "permission" ? `: ${p.content.effect} ${p.content.rule}` : "";
              return `- ${p.kind}:${p.name}${preview}`;
            })].join("\n"),
          );
        }
        const tree = buildInstallTree(h);
        return text(
          JSON.stringify(
            {
              harness: h.name,
              description: h.description,
              contains: tree.summary,
              envVars: tree.envVars,
              instructions:
                "Write each file at its path relative to the new project folder. Ask before overwriting existing files. Then tell the user which envVars to set and to restart Claude Code.",
              files: tree.files,
            },
            null,
            2,
          ),
        );
      }),
    );

    server.registerTool(
      "compose_harness",
      {
        title: "Compose harness",
        description:
          "Make a new harness from parts of the user's existing harnesses and save it. Every deny permission from each source harness is always included. " +
          "If two sources have a part with the same kind:name but different contents, the tool returns the conflicts; ask the user which to keep and call again with prefer.",
        inputSchema: z.object({
          name: z.string().min(1).max(80).describe("Name for the new harness."),
          description: z.string().max(500).optional(),
          from: z
            .array(
              z.object({
                harness: z.string().describe("Source harness name."),
                parts: z.array(z.string()).optional().describe("kind:name keys to take (from get_harness view 'parts'). Omit to take every part."),
              }),
            )
            .min(1),
          prefer: z.record(z.string(), z.string()).optional().describe("For a conflicting kind:name key, the source harness name whose version to keep."),
          replace: z.boolean().optional(),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      },
      safe(async ({ name, description, from, prefer, replace }, ctx) => {
        const userId = userOf(ctx);
        const sources = await Promise.all(from.map((f) => getHarness(userId, { name: f.harness })));
        const missing = from.filter((_, i) => !sources[i]).map((f) => f.harness);
        if (missing.length) return fail(`No harness named ${missing.map((m) => `"${m}"`).join(", ")}. Call list_harnesses for exact names.`);

        const selected: string[] = [];
        const unknownKeys: string[] = [];
        from.forEach((f, i) => {
          const h = sources[i]!;
          if (!f.parts) return selected.push(...h.parts.map((p) => p.id));
          for (const key of f.parts) {
            const p = h.parts.find((x) => `${x.kind}:${x.name}` === key);
            if (p) selected.push(p.id);
            else unknownKeys.push(`${key} (in "${h.name}")`);
          }
        });
        if (unknownKeys.length) return fail(`Unknown parts: ${unknownKeys.join(", ")}. Call get_harness with view "parts" to see valid kind:name keys.`);

        const resolutions: Record<string, string> = {};
        for (const [key, harnessName] of Object.entries(prefer ?? {})) {
          const h = sources.find((s) => s!.name === harnessName);
          const p = h?.parts.find((x) => `${x.kind}:${x.name}` === key);
          if (p) resolutions[key] = p.id;
        }

        const nameOf = new Map(sources.map((s) => [s!.id, s!.name]));
        const r = await composeAndSave(userId, {
          name,
          description,
          harnessIds: sources.map((s) => s!.id),
          selectedPartIds: selected,
          resolutions,
          replace,
        });
        if (!r.ok) {
          if (r.conflicts?.length) {
            return fail(
              "Not saved: these parts differ between sources. Ask the user which version to keep, then call again with prefer set.\n" +
                r.conflicts.map((c) => `- ${c.key}: in ${c.harnessIds.map((id) => `"${nameOf.get(id)}"`).join(" and ")}`).join("\n"),
            );
          }
          return fail(r.message);
        }
        const auto = r.value.autoIncluded ? ` (${r.value.autoIncluded} deny rules were added automatically for safety)` : "";
        return text(`Saved composed harness "${name}" with ${r.value.parts.length} parts${auto}. View it at ${harnessUrl(r.value.id)}`);
      }),
    );

    server.registerPrompt(
      "save-harness",
      {
        title: "Save this folder's harness to Hangar",
        description: "Collect, distill and save the current project's Claude Code harness.",
        argsSchema: z.object({ name: z.string().optional().describe("Name for the harness") }),
      },
      ({ name }) => ({ messages: [{ role: "user", content: { type: "text", text: saveHarnessPrompt(name) } }] }),
    );

    server.registerPrompt(
      "install-harness",
      {
        title: "Install a Hangar harness into this folder",
        description: "Set up this folder as a new Claude Code project from one of your harnesses.",
        argsSchema: z.object({ name: z.string().optional().describe("Harness name") }),
      },
      ({ name }) => ({ messages: [{ role: "user", content: { type: "text", text: installHarnessPrompt(name) } }] }),
    );
  },
  { serverInfo: { name: "hangar", version: "0.1.0" } },
);

async function authed(req: Request): Promise<Response> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(\S+)$/i)?.[1];
  let who: Awaited<ReturnType<typeof authenticateToken>> = null;
  try {
    who = token ? await authenticateToken(token) : null;
  } catch (e) {
    console.error("token check failed", e);
    return Response.json(
      { jsonrpc: "2.0", id: null, error: { code: -32603, message: "Hangar could not reach its database. Try again in a minute." } },
      { status: 503 },
    );
  }
  if (!token || !who) {
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message: `Missing, invalid or revoked Hangar token. Sign in at ${siteUrl()}/connect, create a token, and re-run the "claude mcp add" command it shows.`,
        },
      },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer error="invalid_token", error_description="Get a token at /connect"' } },
    );
  }
  if (!(await underRateLimit(who.tokenId, "mcp_request"))) {
    const retryAfter = secondsUntilReset("mcp_request");
    return Response.json(rateLimitedBody(await jsonRpcId(req), retryAfter), {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }
  (req as Request & { auth?: unknown }).auth = { token, clientId: who.userId, scopes: [], extra: { tokenId: who.tokenId } };
  return handler(req);
}

/** The JSON-RPC id of a single POSTed request, so the 429 answers the call it refuses. Null otherwise. */
async function jsonRpcId(req: Request): Promise<string | number | null> {
  if (req.method !== "POST") return null;
  try {
    const id = ((await req.json()) as { id?: unknown })?.id;
    return typeof id === "string" || typeof id === "number" ? id : null;
  } catch {
    return null;
  }
}

export { authed as GET, authed as POST, authed as DELETE };
