import { describe, expect, it } from "vitest";
import {
  checkStorageBudget,
  formatMB,
  MAX_STORAGE_BYTES_PER_USER,
  RATE_LIMITED_CODE,
  RATE_LIMITS,
  rateLimitedBody,
  saveLimitMessage,
  secondsUntilReset,
} from "./limits";

describe("rate limit constants", () => {
  it("match the SQL function hangar_rate_check", () => {
    expect(RATE_LIMITS.mcp_request).toEqual({ limit: 120, windowSeconds: 60 });
    expect(RATE_LIMITS.save).toEqual({ limit: 60, windowSeconds: 3600 });
    expect(MAX_STORAGE_BYTES_PER_USER).toBe(20_000_000);
  });
  it("uses an implementation-defined JSON-RPC server error code", () => {
    expect(RATE_LIMITED_CODE).toBeLessThanOrEqual(-32000);
    expect(RATE_LIMITED_CODE).toBeGreaterThanOrEqual(-32099);
  });
});

describe("secondsUntilReset", () => {
  const minute = Date.UTC(2026, 10, 18, 12, 0, 0);
  it("counts down to the next epoch-aligned window", () => {
    expect(secondsUntilReset("mcp_request", minute)).toBe(60);
    expect(secondsUntilReset("mcp_request", minute + 15_000)).toBe(45);
    expect(secondsUntilReset("mcp_request", minute + 59_500)).toBe(1);
    expect(secondsUntilReset("save", minute + 30 * 60_000)).toBe(1800);
  });
  it("never returns less than one second", () => {
    expect(secondsUntilReset("mcp_request", minute + 59_999)).toBe(1);
  });
});

describe("rateLimitedBody", () => {
  it("is a JSON-RPC error that echoes the id and tells the model to wait", () => {
    const body = rateLimitedBody(7, 42);
    expect(body.jsonrpc).toBe("2.0");
    expect(body.id).toBe(7);
    expect(body.error.code).toBe(RATE_LIMITED_CODE);
    expect(body.error.data).toEqual({ retryAfterSeconds: 42 });
    expect(body.error.message).toContain("120 requests");
    expect(body.error.message).toContain("Wait 42 seconds");
    expect(body.error.message).toContain("retry");
  });
  it("allows a null id and phrases long waits in minutes", () => {
    const body = rateLimitedBody(null, 600);
    expect(body.id).toBeNull();
    expect(body.error.message).toContain("Wait 10 minutes");
    expect(rateLimitedBody(null, 1).error.message).toContain("Wait 1 second,");
  });
});

describe("saveLimitMessage", () => {
  it("states the limit, that nothing was saved, and how long to wait", () => {
    const m = saveLimitMessage(1500);
    expect(m).toContain("60 saves or composes per hour");
    expect(m).toContain("Nothing was saved");
    expect(m).toContain("25 minutes");
  });
});

describe("checkStorageBudget", () => {
  const libraryUrl = "https://example.test/library";
  it("allows a save that fits, including exactly at the limit", () => {
    expect(checkStorageBudget({ usedBytes: 0, incomingBytes: 1_500_000, libraryUrl })).toEqual({ ok: true });
    expect(checkStorageBudget({ usedBytes: 18_500_000, incomingBytes: 1_500_000, libraryUrl })).toEqual({ ok: true });
  });
  it("refuses one byte over, with usage and how to free space", () => {
    const r = checkStorageBudget({ usedBytes: 18_500_001, incomingBytes: 1_500_000, libraryUrl });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toContain("20.0 MB limit");
    expect(r.message).toContain("18.5 MB");
    expect(r.message).toContain("1.5 MB");
    expect(r.message).toContain(libraryUrl);
    expect(r.message).toContain("replace: true");
  });
  it("honours a custom maximum", () => {
    expect(checkStorageBudget({ usedBytes: 5, incomingBytes: 6, libraryUrl, maxBytes: 10 }).ok).toBe(false);
  });
  it("formats megabytes with one decimal", () => {
    expect(formatMB(0)).toBe("0.0 MB");
    expect(formatMB(12_345_678)).toBe("12.3 MB");
  });
});
