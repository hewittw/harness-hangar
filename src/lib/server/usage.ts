import "server-only";
import { admin } from "./admin";
import type { RateKind } from "../limits";

/**
 * Counts one request against a Postgres-backed fixed-window limit (hangar_rate_check).
 * Returns false when the caller is over the limit.
 *
 * Fails OPEN: if the check itself errors, the request goes through and the error is logged.
 * These limits are throttles against runaway loops, not a security boundary. Every request is
 * already token-authenticated, and the hard caps that protect the database (harness count,
 * per-harness size, per-user storage) are enforced separately and fail closed. Failing closed here
 * would turn a hiccup in a bookkeeping table into a full outage for every user.
 */
export async function underRateLimit(subject: string, kind: RateKind): Promise<boolean> {
  try {
    const { data, error } = await admin().rpc("hangar_rate_check", { p_subject: subject, p_kind: kind });
    if (error) throw error;
    return data !== false;
  } catch (e) {
    console.error("rate check failed; allowing request", kind, e);
    return true;
  }
}

/** Stored bytes of the user's harness parts, optionally leaving out one harness (the one being replaced). Throws on error. */
export async function userStorageBytes(userId: string, excludeHarnessId?: string | null): Promise<number> {
  const { data, error } = await admin().rpc("user_storage_bytes", {
    p_user_id: userId,
    p_exclude_harness_id: excludeHarnessId ?? null,
  });
  if (error) throw error;
  return Number(data ?? 0);
}
