import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exchangeCodeForTokens, refreshTokens, buildAuthorizeUrl, RefreshRevokedError } from "./oauth.js";

function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn(async () =>
    new Response(JSON.stringify(body), { status })) as any;
}

beforeEach(() => vi.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00Z")));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("buildAuthorizeUrl", () => {
  it("includes the required query params and the state", () => {
    const url = new URL(buildAuthorizeUrl("xyz"));
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("state")).toBe("xyz");
    expect(url.searchParams.get("client_id")).toBeTruthy();
    expect(url.searchParams.get("scope")).toContain("bits:read");
  });
});

describe("exchangeCodeForTokens", () => {
  it("maps expires_in to an absolute expiresAt", async () => {
    mockFetch(200, {
      access_token: "a", refresh_token: "r", expires_in: 3600,
      scope: ["bits:read"], token_type: "bearer",
    });
    const set = await exchangeCodeForTokens("code123");
    expect(set.accessToken).toBe("a");
    expect(set.expiresAt).toBe(Date.parse("2026-01-01T00:00:00Z") + 3_600_000);
  });
});

describe("refreshTokens", () => {
  it("persists the rotated refresh token from the response", async () => {
    mockFetch(200, {
      access_token: "a2", refresh_token: "r2-rotated", expires_in: 3600,
      scope: ["bits:read"], token_type: "bearer",
    });
    const set = await refreshTokens("r1-old");
    expect(set.refreshToken).toBe("r2-rotated");
  });

  it("throws RefreshRevokedError on 401 (dead)", async () => {
    mockFetch(401, { error: "Bad Request" });
    await expect(refreshTokens("r1")).rejects.toBeInstanceOf(RefreshRevokedError);
  });

  it("throws a plain Error on 500 (transient, not dead)", async () => {
    mockFetch(500, {});
    const err = await refreshTokens("r1").catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(RefreshRevokedError);
  });
});
