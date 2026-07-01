import type { NormalizedNotification } from "../twitch/eventSubClient.js";
import type { NormalizedAlert } from "./types.js";

const TIERS: Record<string, 1 | 2 | 3> = { "1000": 1, "2000": 2, "3000": 3 };

const str = (e: Record<string, unknown>, k: string) => (typeof e[k] === "string" ? (e[k] as string) : undefined);
const num = (e: Record<string, unknown>, k: string) => (typeof e[k] === "number" ? (e[k] as number) : undefined);
const bool = (e: Record<string, unknown>, k: string) => e[k] === true;

export function normalize(n: NormalizedNotification): NormalizedAlert | null {
  const e = n.event;
  const base = { id: n.messageId, createdAt: Date.now() };

  switch (n.subscriptionType) {
    case "channel.follow":
      return { ...base, kind: "follow", displayName: str(e, "user_name") ?? "Someone" };

    case "channel.subscribe":
      if (bool(e, "is_gift")) return null;
      return {
        ...base, kind: "subscription", displayName: str(e, "user_name") ?? "Someone",
        tier: TIERS[str(e, "tier") ?? "1000"] ?? 1
      };

    case "channel.subscription.gift":
      const anon = bool(e, "is_anonymous");
      return {
        ...base, kind: "gift",
        displayName: anon ? "Anonymous" : (str(e, "user_name") ?? "Anonymous"),
        tier: TIERS[str(e, "tier") ?? "1000"] ?? 1,
        count: num(e, "total") ?? 1
      };

    case "channel.subscription.message": {
      const message = (e.message as { text?: string } | undefined)?.text;
      return {
        ...base, kind: "resub", displayName: str(e, "user_name") ?? "Someone",
        tier: TIERS[str(e, "tier") ?? "1000"] ?? 1,
        months: num(e, "cumulative_months") ?? 1, message
      };
    }

    case "channel.cheer": {
      const anon = bool(e, "is_anonymous");
      return {
        ...base, kind: "cheer",
        displayName: anon ? "Anonymous" : (str(e, "user_name") ?? "Anonymous"),
        bits: num(e, "bits") ?? 0,
        message: str(e, "message")
      };
    }

    case "channel.raid":
      return {
        ...base, kind: "raid",
        displayName: str(e, "from_broadcaster_user_name") ?? "Someone",
        count: num(e, "viewers") ?? 0
      };

    default:
      return null;
  }
}
