import type { NormalizedAlert } from "./types.js";
import type { AlertConfig } from "../config/schema.js";

export function shouldAlert(alert: NormalizedAlert, cfg: AlertConfig): boolean {
  if (!cfg.enabled) return false;
  return amountFor(alert) >= cfg.minAmount;
}

function amountFor(a: NormalizedAlert): number {
  switch (a.kind) {
    case "cheer": return a.bits ?? 0;
    case "gift": return a.count ?? 0;
    case "raid": return a.count ?? 0;
    case "resub": return a.months ?? 0;
    default: return Number.POSITIVE_INFINITY;
  }
}
