import type { NormalizedAlert } from "./types.js";

export class GiftAggregator {
  private buffers = new Map<string, { alert: NormalizedAlert; timer: NodeJS.Timeout }>();

  constructor(private windowMs: number, private flush: (a: NormalizedAlert) => void) { }

  add(alert: NormalizedAlert): void {
    if (alert.kind !== "gift") { this.flush(alert); return; }

    const key = alert.displayName;
    const existing = this.buffers.get(key);
    if (existing) {
      existing.alert.count = (existing.alert.count ?? 0) + (alert.count ?? 0);
      return;
    }
    const timer = setTimeout(() => {
      const b = this.buffers.get(key);
      this.buffers.delete(key);
      if (b) this.flush(b.alert);
    }, this.windowMs);
    this.buffers.set(key, { alert: { ...alert }, timer });
  }
}
