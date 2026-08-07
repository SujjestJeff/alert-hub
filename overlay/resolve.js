import { KIND_CLASS } from './kinds.js';

export function magnitudeOf(kind, alert) {
  switch (kind) {
    case 'cheer':
      return alert.bits ?? 0;
    case 'gift':
      return alert.count ?? 0;
    case 'raid':
      return alert.count ?? 0;
    case 'resub':
      return alert.months ?? 0;
    case 'subscription':
      return alert.tier ?? 1;
    default:
      return null;
  }
}

function pickTier(cfg, magnitude) {
  if (magnitude == null || !Array.isArray(cfg.tiers)) return null;
  let match = null;
  for (const tier of cfg.tiers) {
    if (magnitude >= tier.minAmount) match = tier;
  }
  return match;
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function resolveAlert(kind, cfg, alert) {
  const tier = pickTier(cfg, magnitudeOf(kind, alert));
  const variations = tier?.variations ?? cfg.variations;
  return {
    template: pick(variations),
    sound: tier?.sound ?? cfg.sound,
    holdMs: tier?.holdMs ?? cfg.holdMs,
    cssClass: `${KIND_CLASS[kind] ?? ''} ${tier?.cssClass ?? ''}`.trim(),
  };
}
