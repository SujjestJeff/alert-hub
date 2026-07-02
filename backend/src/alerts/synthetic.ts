import type { NormalizedAlert } from "./types.js";
import type { AlertKind } from "../config/schema.js"

export function makeSyntheticAlert(kind: AlertKind): NormalizedAlert {
  const base = { id: `test-${kind}-${Date.now()}`, kind, displayName: "TestUser", createdAt: Date.now() };
  switch (kind) {
    case "subscription": return { ...base, tier: 1 };
    case "resub": return { ...base, tier: 1, months: 6, message: "Test resub!" };
    case "gift": return { ...base, tier: 1, count: 5 };
    case "cheer": return { ...base, bits: 500, message: "Test cheer!" };
    case "raid": return { ...base, count: 42 };
    default: return base;
  }
}
