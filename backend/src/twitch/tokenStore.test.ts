import { describe, it, expect, beforeEach } from "vitest";
import { loadTokens, saveTokens, clearTokens } from "./tokenStore.js";

const sample = {
  accessToken: "a1",
  refreshToken: "r1",
  expiresAt: Date.now() + 3_600_000,
  scopes: ["bits:read", "channel:read:subscriptions"],
};

describe("tokenStore", () => {
  beforeEach(() => clearTokens());

  it("returns null when empty", () => {
    expect(loadTokens()).toBeNull();
  });

  it("round-trips a saved set, scopes included", () => {
    saveTokens(sample);
    expect(loadTokens()).toEqual(sample);
  });

  it("upsert overwrites rather than duplicating", () => {
    saveTokens(sample);
    saveTokens({ ...sample, accessToken: "a2" });
    expect(loadTokens()?.accessToken).toBe("a2");
  });

  it("clear removes the row", () => {
    saveTokens(sample);
    clearTokens();
    expect(loadTokens()).toBeNull();
  });
})
