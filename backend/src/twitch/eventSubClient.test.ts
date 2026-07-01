import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./helix.js", () => ({
  createSubscription: vi.fn(async () => "enabled"),
  getBraodcasterId: vi.fn(async () => "123"),
}));
vi.mock("ws", () => ({ default: class { on() { } close() { } terminate() { } } }));

import { EventSubClient } from "./eventSubClient.js";
import { createSubscription } from "./helix.js";

const fakeSocket = () => ({ close: vi.fn(), terminate: vi.fn(), on: vi.fn() }) as any;
const now = () => new Date().toISOString();

const welcome = (id = "sess1") => JSON.stringify({
  metadata: { message_id: `w-${id}`, message_type: "session_welcome", message_timestamp: now() },
  payload: { session: { id, keepalive_timeout_seconds: 10, reconnect_url: null } },
});
const notification = (type = "channel.follow", id = "n1") => JSON.stringify({
  metadata: { message_id: id, message_type: "notification", subscription_type: type, message_timestamp: now() },
  payload: { subscription: { id: "s", type, status: "enabled" }, event: { user_name: "Alice" } },
});
const reconnect = (url = "wss://new/ws") => JSON.stringify({
  metadata: { message_id: "r1", message_type: "session_reconnect", message_timestamp: now() },
  payload: { session: { id: "sess1", keepalive_timeout_seconds: null, reconnect_url: url } },
});

beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks(); });
afterEach(() => vi.useRealTimers());

describe("rouding", () => {
  it("emits a normalized notification", () => {
    const c = new EventSubClient("123");
    const got: any[] = [];
    c.on("notification", (n) => got.push(n));
    c.handleRaw(notification("channel.cheer", "n1"), fakeSocket(), false);
    expect(got[0]).toMatchObject({ subscriptionType: "channel.cheer", messageId: "n1" });
    expect(got[0].event).toMatchObject({ user_name: "Alice" });
  });

  it("drops duplicate message_ids", () => {
    const c = new EventSubClient("123");
    const got: any[] = [];
    c.on("notification", (n) => got.push(n));
    c.handleRaw(notification("channel.follow", "dup"), fakeSocket(), false);
    c.handleRaw(notification("channel.follow", "dup"), fakeSocket(), false);
    expect(got).toHaveLength(1);
  });

  it("emits revocation", () => {
    const c = new EventSubClient("123");
    const got: any[] = [];
    c.on("revocation", (s) => got.push(s))
    c.handleRaw(JSON.stringify({
      metadata: { message_id: "rev1", message_type: "revocation", message_timestamp: now() },
      payload: { subscription: { id: "s", type: "channel.follow", status: "authorization_revoked" } },
    }), fakeSocket(), false);
    expect(got[0]).toMatchObject({ status: "authorization_revoked" });
  });
});

describe("the resubscribe distinction", () => {
  it("subscribes on a FRESH welcome", async () => {
    const c = new EventSubClient("123");
    c.handleRaw(welcome("sess1"), fakeSocket(), false);
    await vi.runAllTimersAsync();
    expect((createSubscription as any).mock.calls.length).toBeGreaterThanOrEqual(6);
  });

  it("does NOT resubscribe on a MIGRATION welcome", async () => {
    const c = new EventSubClient("123");
    c.handleRaw(welcome("sess2"), fakeSocket(), true);
    await vi.runAllTimersAsync();
    expect(createSubscription).not.toHaveBeenCalled();
  })

  it("session_reconnect opens a migration connection, no resubscribe", () => {
    const c = new EventSubClient("123");
    const connectSpy = vi.spyOn(c as any, "connect").mockImplementation(() => { });
    c.handleRaw(reconnect("wss://new/ws"), fakeSocket(), false);
    expect(connectSpy).toHaveBeenCalledWith("wss://new/ws", true);
    expect(createSubscription).not.toHaveBeenCalled();
  });
});
