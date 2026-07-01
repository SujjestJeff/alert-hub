export type AlertKind = "follow" | "subscription" | "resub" | "gift" | "raid" | "cheer";

export interface NormalizedAlert {
  id: string;
  kind: AlertKind;
  displayName: string;
  createdAt: number;
  tier?: 1 | 2 | 3;
  months?: number;
  count?: number;
  bits?: number;
  message?: string;
}
