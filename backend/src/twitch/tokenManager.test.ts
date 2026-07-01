import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./oauth.js", async (importActual) => {
  const actual = await importActual<typeof import("./oauth.js")>();
  return {
    ...actual,
    refreshTokens: vi.fn(),
    validateToken: vi.fn(),
  };
});

import { refreshTokens, RefreshRevokedError } from "./oauth.js";
import { clearTokens } from "./tokenStore.js";

async function freshManager() {
  vi.resetModules();
  return (await import("./tokenManager.js")).tokenManager;
}

const validSet = () => ({
  accessToken: "a", refreshToken: "r",
  expiresAt: Date.now() + 3_600_00, scopes: ["bits:read"],
});

beforeEach(() => { clearTokens(); vi.useFakeTimers(); vi.clearAllMocks(); });
afterEach(() => vi.useRealTimers());

describe("getValidAccessToken", () => {
  it("returns the cached token when comfortably valid (no refresh)", async () => {
    const m = await freshManager();
    m.setTokenSet(validSet());
    expect(await m.getValidAccessToken()).toBe("a");
    expect(refreshTokens).not.toHaveBeenCalled();
  });

  it("single-flights concurrent refreshes into one network call", async () => {
    (refreshTokens as any).mockResolvedValue({ ...validSet(), accessToken: "a2" });
    const m = await freshManager();
    m.setTokenSet({ ...validSet(), expiresAt: Date.now() - 1 });

    const [t1, t2] = await Promise.all([m.getValidAccessToken(), m.getValidAccessToken()]);
    expect(t1).toBe("a2");
    expect(t2).toBe("a2");
    expect(refreshTokens).toHaveBeenCalledTimes(1);
  });
});

describe("refresh failure handling", () => {
  it("marks needs-reauth and emits on a dead refresh token", async () => {
    (refreshTokens as any).mockRejectedValue(new RefreshRevokedError("401"));
    const m = await freshManager();
    m.setTokenSet({ ...validSet(), expiresAt: Date.now() - 1 });

    const emitted = vi.fn();
    m.on("needs-reauth", emitted);

    await expect(m.getValidAccessToken()).rejects.toBeInstanceOf(RefreshRevokedError);
    expect(m.status().needsReauth).toBe(true);
    expect(emitted).toHaveBeenCalledOnce();
  });

  it("does NOT mark needs-reauth on transient failure", async () => {
    (refreshTokens as any).mockRejectedValue(new Error("500"));
    const m = await freshManager();
    m.setTokenSet({ ...validSet(), expiresAt: Date.now() - 1 });

    await expect(m.getValidAccessToken()).rejects.toThrow();
    expect(m.status().needsReauth).toBe(false);
  });
});

describe("proactive scheduling", () => {
  it("refreshes on its own before expiry, without a caller", async () => {
    (refreshTokens as any).mockResolvedValue({ ...validSet(), accessToken: "a2" });
    const m = await freshManager();
    m.setTokenSet(validSet());

    await vi.advanceTimersByTimeAsync(41 * 60 * 1000);
    expect(refreshTokens).toHaveBeenCalled();
  });
});
