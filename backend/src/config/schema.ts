import { z } from "zod";

export const ALERT_KINDS = ["follow", "subscription", "resub", "gift", "cheer", "raid"] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export const AlertConfigSchema = z.object({
  enabled: z.boolean(),
  template: z.string().min(1).max(200),
  sound: z.string().max(500).nullable(),
  image: z.string().max(500).nullable(),
  holdMs: z.number().int().min(500).max(30_000),
  minAmount: z.number().int().min(0),
});
export type AlertConfig = z.infer<typeof AlertConfigSchema>;

export const SettingsSchema = z.object({
  aggregationWindowMs: z.number().int().min(0).max(10_000),
  gapMs: z.number().int().min(0).max(10_000),
  maxDurationMs: z.number().int().min(1_00).max(60_000),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_ALERTS: Record<AlertKind, AlertConfig> = {
  follow: {
    enabled: true, template: "{name} just followed!",
    sound: "/overlay/sounds/follow.ogg", image: null, holdMs: 3000, minAmount: 0
  },
  subscription: {
    enabled: true, template: "{name} subscribed! (Tier {tier})",
    sound: "/overlay/sounds/sub.ogg", image: null, holdMs: 4000, minAmount: 0
  },
  resub: {
    enabled: true, template: "{name} resubbed — {months} months!",
    sound: "/overlay/sounds/sub.ogg", image: null, holdMs: 4000, minAmount: 0
  },
  gift: {
    enabled: true, template: "{name} gifted {count} subs!",
    sound: "/overlay/sounds/gift.ogg", image: null, holdMs: 4500, minAmount: 0
  },
  cheer: {
    enabled: true, template: "{name} cheered {bits} bits!",
    sound: "/overlay/sounds/cheer.ogg", image: null, holdMs: 3500, minAmount: 0
  },
  raid: {
    enabled: true, template: "{name} raided with {count}!",
    sound: "/overlay/sounds/raid.ogg", image: null, holdMs: 5000, minAmount: 0
  },
};

export const DEFAULT_SETTINGS: Settings = { aggregationWindowMs: 2000, gapMs: 500, maxDurationMs: 8000 };

