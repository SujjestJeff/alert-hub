import { describe, it, expect, vi } from "vitest";
import { makeStatusSnapshot } from "./statusService.js";

vi.mock("../twitch/tokenManager.js", () => ({
  tokenManager: { status: () => ({ connected: true, needsReauth: false, expiresAt: 1 }) },
}));

describe("makeStatusSnapshot", () => {
  it("is healthy only when Twitch is connected AND EventSub is connected", () => {
    const hub = { size: 1 } as any;
    expect(makeStatusSnapshot({ state: "connected", sessionId: "s" } as any, hub, Date.now()).healthy).toBe(true);
    expect(makeStatusSnapshot({ state: "reconnecting", sesionId: null } as any, hub, null).healthy).toBe(false);
  });
});
