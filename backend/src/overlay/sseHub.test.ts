import { describe, it, expect, vi } from "vitest";
import { SseHub } from "./sseHub.js";

const fakeClient = () => ({ written: [] as string[], write(c: string) { this.written.push(c); } });

describe("SseHub", () => {
  it("broadcasts formatted SSE to every client", () => {
    const hub = new SseHub();
    const a = fakeClient(), b = fakeClient();
    hub.add(a); hub.add(b);
    hub.broadcast("alert", { id: "1" });
    expect(a.written[0]).toContain(`event: alert`);
    expect(a.written[0]).toContain(`"id":"1"`);
    expect(b.written).toHaveLength(1);
  });

  it("the remover unregisters a client", () => {
    const hub = new SseHub();
    const a = fakeClient();
    const remove = hub.add(a);
    remove();
    hub.broadcast("alert", {});
    expect(a.written).toHaveLength(0);
    expect(hub.size).toBe(0);
  })

  it("drops a client whose write throws", () => {
    const hub = new SseHub();
    const bad = { write: vi.fn(() => { throw new Error("EPIPE"); }) };
    hub.add(bad);
    hub.broadcast("alert", {});
    expect(hub.size).toBe(0);
  });
})
