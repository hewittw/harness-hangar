/**
 * Abuse limits. The counters live in Postgres (see supabase/migrations/20261118040000_usage_limits.sql)
 * because in-memory counters reset on every serverless cold start. The limits and windows below
 * mirror the SQL function hangar_rate_check, which is the source of truth; these copies only feed
 * messages and the Retry-After header.
 */

export type RateKind = "mcp_request" | "save";

export const RATE_LIMITS: Record<RateKind, { limit: number; windowSeconds: number }> = {
  mcp_request: { limit: 120, windowSeconds: 60 }, // per token
  save: { limit: 60, windowSeconds: 3600 }, // per user, saves and composes together
};

/** Total stored size of one user's harness parts. */
export const MAX_STORAGE_BYTES_PER_USER = 20_000_000;

/** JSON-RPC server-defined error code used for rate limiting (-32000..-32099 is implementation-defined). */
export const RATE_LIMITED_CODE = -32029;

/** Seconds until the current fixed window ends. Windows are aligned to the Unix epoch, like date_bin in SQL. */
export function secondsUntilReset(kind: RateKind, nowMs: number = Date.now()): number {
  const windowMs = RATE_LIMITS[kind].windowSeconds * 1000;
  return Math.max(1, Math.ceil((windowMs - (nowMs % windowMs)) / 1000));
}

function waitPhrase(seconds: number): string {
  if (seconds === 1) return "1 second";
  if (seconds < 90) return `${seconds} seconds`;
  return `${Math.ceil(seconds / 60)} minutes`;
}

/** Body of the HTTP 429 the MCP route returns. Written for the model reading it. */
export function rateLimitedBody(id: string | number | null, retryAfterSeconds: number) {
  const { limit } = RATE_LIMITS.mcp_request;
  return {
    jsonrpc: "2.0" as const,
    id,
    error: {
      code: RATE_LIMITED_CODE,
      message:
        `Hangar rate limit: this token sent more than ${limit} requests in the last minute. ` +
        `Nothing was run or changed. Wait ${waitPhrase(retryAfterSeconds)}, then retry the same call once. ` +
        `Don't retry in a tight loop; if this keeps happening, tell the user.`,
      data: { retryAfterSeconds },
    },
  };
}

/** Message when a user has hit the hourly save/compose limit. */
export function saveLimitMessage(retryAfterSeconds: number): string {
  const { limit } = RATE_LIMITS.save;
  return (
    `Hangar limit: ${limit} saves or composes per hour, and this account has reached it. Nothing was saved. ` +
    `Wait ${waitPhrase(retryAfterSeconds)}, then try again.`
  );
}

export function formatMB(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * Whether saving `incomingBytes` fits in the user's storage budget, given what their other
 * harnesses already use. Returns a model-readable refusal when it doesn't.
 */
export function checkStorageBudget(input: {
  usedBytes: number;
  incomingBytes: number;
  libraryUrl: string;
  maxBytes?: number;
}): { ok: true } | { ok: false; message: string } {
  const max = input.maxBytes ?? MAX_STORAGE_BYTES_PER_USER;
  if (input.usedBytes + input.incomingBytes <= max) return { ok: true };
  return {
    ok: false,
    message:
      `Not saved: this account's Hangar storage would go over its ${formatMB(max)} limit. ` +
      `Other harnesses use ${formatMB(input.usedBytes)} and this one needs about ${formatMB(input.incomingBytes)}. ` +
      `To free space, ask the user to delete harnesses they no longer need at ${input.libraryUrl}, ` +
      `or save it with replace: true over an existing harness that is larger, or leave out large files and call again.`,
  };
}
