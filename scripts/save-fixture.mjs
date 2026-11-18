#!/usr/bin/env node
// Save a fixture harness to Hangar through the MCP endpoint, the same way Claude Code would.
//
//   HANGAR_TOKEN=hk_... node scripts/save-fixture.mjs fixtures/hw5-harness.json [--replace]
//
// Env: HANGAR_TOKEN (required, from the Connect page), HANGAR_URL (default http://localhost:3000).

import { readFile } from "node:fs/promises";

const USAGE = "Usage: HANGAR_TOKEN=hk_... node scripts/save-fixture.mjs <fixture.json> [--replace]";

function die(message) {
  console.error(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const unknownFlags = args.filter((a) => a.startsWith("--") && a !== "--replace");
const paths = args.filter((a) => !a.startsWith("--"));
if (unknownFlags.length) die(`Unknown option: ${unknownFlags.join(" ")}\n${USAGE}`);
if (paths.length !== 1) die(USAGE);

const token = process.env.HANGAR_TOKEN;
if (!token) die(`HANGAR_TOKEN is not set. Create a token on the Hangar Connect page and run:\n  ${USAGE}`);

const baseUrl = (process.env.HANGAR_URL || "http://localhost:3000").replace(/\/+$/, "");
const endpoint = `${baseUrl}/api/mcp`;

let fixture;
try {
  fixture = JSON.parse(await readFile(paths[0], "utf8"));
} catch (e) {
  die(`Could not read ${paths[0]} as JSON: ${e.message}`);
}
const { name, description, parts } = fixture;
if (typeof name !== "string" || !Array.isArray(parts)) die(`${paths[0]} needs a "name" string and a "parts" array.`);

let sessionId;
let nextId = 1;

/** Parse a JSON or SSE-framed (`data:` lines) response body into JSON-RPC messages. */
function parseBody(text, contentType) {
  if (!text.trim()) return [];
  if (contentType.includes("text/event-stream")) {
    const messages = [];
    for (const event of text.split(/\r?\n\r?\n/)) {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""))
        .join("\n");
      if (data) messages.push(JSON.parse(data));
    }
    return messages;
  }
  const json = JSON.parse(text);
  return Array.isArray(json) ? json : [json];
}

/** POST one JSON-RPC message. Requests (with an id) resolve to the matching response. */
async function rpc(method, params, { notification = false } = {}) {
  const body = { jsonrpc: "2.0", method, ...(params ? { params } : {}) };
  const id = notification ? undefined : nextId++;
  if (id !== undefined) body.id = id;

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        ...(sessionId ? { "mcp-session-id": sessionId } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    die(`Could not reach ${endpoint}: ${e.cause?.code ?? e.message}. Is the Hangar server running at ${baseUrl}?`);
  }

  sessionId = res.headers.get("mcp-session-id") ?? sessionId;
  const text = await res.text();
  let messages;
  try {
    messages = parseBody(text, res.headers.get("content-type") ?? "");
  } catch {
    die(`${method}: HTTP ${res.status}, response was not JSON:\n${text.slice(0, 500)}`);
  }
  const reply = messages.find((m) => m.id === id) ?? messages.find((m) => m.error);
  if (reply?.error) die(`${method} failed (HTTP ${res.status}): ${reply.error.message}`);
  if (!res.ok) die(`${method} failed: HTTP ${res.status}\n${text.slice(0, 500)}`);
  if (notification) return undefined;
  if (!reply) die(`${method}: no JSON-RPC response with id ${id} in:\n${text.slice(0, 500)}`);
  return reply.result;
}

const init = await rpc("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "hangar-save-fixture", version: "0.1.0" },
});
console.log(`Connected to ${init?.serverInfo?.name ?? "server"} at ${endpoint}${sessionId ? " (session)" : ""}`);
await rpc("notifications/initialized", undefined, { notification: true });

const result = await rpc("tools/call", {
  name: "save_harness",
  arguments: { name, ...(description ? { description } : {}), parts, ...(replace ? { replace: true } : {}) },
});
const output = (result?.content ?? []).map((c) => (c.type === "text" ? c.text : JSON.stringify(c))).join("\n");
if (result?.isError) die(`save_harness returned an error:\n${output}`);
console.log(output || JSON.stringify(result, null, 2));
