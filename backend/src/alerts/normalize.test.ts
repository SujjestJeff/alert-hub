import { describe, it, expect } from "vitest";
import { normalize } from "./normalize.js";

const notif = (subscriptionType: string, event: Record<string, unknown>, id = "m1") =>
  ({ messageId: id, subscriptionType, event });

describe("normalize", () => {
  it("maps a follow", () => {
    expect(normalize(notif("channel.follow", { user_name: "Alice" })))
      .toMatchObject({ kind: "follow", displayName: "Alice" });
  });

  it("DROPS gifted subscribes (covered by the gift event)", () => {
    expect(normalize(notif("channel.subscribe", { user_name: "Bob", is_gift: true, tier: "1000" })))
      .toBeNull();
  });

  it("keeps a real (non-gift) subscribe with mapped tier", () => {
    expect(normalize(notif("channel.subscribe", { user_name: "Bob", is_gift: false, tier: "2000" })))
      .toMatchObject({ kind: "subscription", displayName: "Bob", tier: 2 });
  });

  it("maps a gift with its total and tier", () => {
    expect(normalize(notif("channel.subscription.gift", { user_name: "Carol", total: 20, tier: "1000" })))
      .toMatchObject({ kind: "gift", displayName: "Carol", count: 20, tier: 1 });
  });

  it("labels anonymous gifters", () => {
    expect(normalize(notif("channel.subscription.gift", { user_name: null, is_anonymous: true, total: 5 })))
      .toMatchObject({ kind: "gift", displayName: "Anonymous", count: 5 });
  });

  it("reads the resub message from the object shape", () => {
    expect(normalize(notif("channel.subscription.message",
      { user_name: "Dee", tier: "3000", cumulative_months: 12, message: { text: "love the stream" } })))
      .toMatchObject({ kind: "resub", tier: 3, months: 12, message: "love the stream" });
  })

  it("reads the cheer message from the string shape", () => {
    expect(normalize(notif("channel.cheer", { user_name: "Eve", bits: 500, message: "pog" })))
      .toMatchObject({ kind: "cheer", displayName: "Eve", bits: 500, message: "pog" });
  });

  it("maps a raid with viewer count", () => {
    expect(normalize(notif("channel.raid", { from_broadcaster_user_name: "BigStreamer", viewers: 300 })))
      .toMatchObject({ kind: "raid", displayName: "BigStreamer", count: 300 });
  });
});
