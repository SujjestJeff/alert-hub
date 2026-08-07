import { z } from 'zod';

export const ALERT_KINDS = [
  'follow',
  'subscription',
  'resub',
  'gift',
  'cheer',
  'raid',
] as const;
export type AlertKind = (typeof ALERT_KINDS)[number];

export const TierSchema = z.object({
  minAmount: z.number().int().min(0),
  variations: z.array(z.string().min(1).max(200)).min(1),
  sound: z.string().max(500).nullable().optional(),
  holdMs: z.number().int().min(500).max(30_000).optional(),
  cssClass: z.string().max(50).optional(),
});
export type Tier = z.infer<typeof TierSchema>;

export const AlertConfigSchema = z
  .object({
    enabled: z.boolean(),
    variations: z.array(z.string().min(1).max(200)).default([]),
    sound: z.string().max(500).nullable(),
    image: z.string().max(500).nullable(),
    holdMs: z.number().int().min(500).max(30_000),
    minAmount: z.number().int().min(0),
    tiers: z.array(TierSchema).default([]),
  })
  .superRefine((cfg, ctx) => {
    for (let i = 1; i < cfg.tiers.length; i++) {
      if (cfg.tiers[i].minAmount <= cfg.tiers[i - 1].minAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['tiers', i, 'minAmount'],
          message: 'tier thresholds must be sorted ascending and unique',
        });
      }
    }
  });

export type AlertConfig = z.infer<typeof AlertConfigSchema>;

export const SettingsSchema = z.object({
  aggregationWindowMs: z.number().int().min(0).max(10_000),
  gapMs: z.number().int().min(0).max(10_000),
  maxDurationMs: z.number().int().min(1_00).max(60_000),
  alertingEnabled: z.boolean().default(true),
  goalsEnabled: z.boolean().default(true),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_ALERTS: Record<AlertKind, AlertConfig> = {
  follow: {
    enabled: true,
    variations: ['{name} just followed!'],
    sound: '/overlay/sounds/follow.ogg',
    image: null,
    holdMs: 3000,
    minAmount: 0,
    tiers: [],
  },
  subscription: {
    enabled: true,
    variations: ['{name} subscribed! (Tier {tier})'],
    sound: '/overlay/sounds/sub.ogg',
    image: null,
    holdMs: 4000,
    minAmount: 0,
    tiers: [],
  },
  resub: {
    enabled: true,
    variations: ['{name} resubbed — {months} months!'],
    sound: '/overlay/sounds/sub.ogg',
    image: null,
    holdMs: 4000,
    minAmount: 0,
    tiers: [],
  },
  gift: {
    enabled: true,
    variations: ['{name} gifted {count} subs!'],
    sound: '/overlay/sounds/gift.ogg',
    image: null,
    holdMs: 4500,
    minAmount: 0,
    tiers: [],
  },
  cheer: {
    enabled: true,
    variations: ['{name} cheered {bits} bits!'],
    sound: '/overlay/sounds/cheer.ogg',
    image: null,
    holdMs: 3500,
    minAmount: 0,
    tiers: [
      {
        minAmount: 1000,
        variations: [
          '💎 {name} dropped {bits}!!',
          '{name} is a legend - {bits} bits!',
        ],
        holdMs: 5000,
        cssClass: 'tier-hype',
      },
    ],
  },
  raid: {
    enabled: true,
    variations: ['{name} raided with {count}!'],
    sound: '/overlay/sounds/raid.ogg',
    image: null,
    holdMs: 5000,
    minAmount: 0,
    tiers: [],
  },
};

export const DEFAULT_SETTINGS: Settings = {
  aggregationWindowMs: 2000,
  gapMs: 500,
  maxDurationMs: 8000,
  alertingEnabled: true,
  goalsEnabled: true,
};
