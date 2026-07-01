import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { GiftAggregator } from "./giftAggregator.js";
import type { NormalizedAlert } from "./types.js";

const gift = (name: string, count: number): NormalizedAlert =>
  ({ id: name + count, kind: "gift", displayName: name, count, createdAt: 0 });

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("merges same-gifter gifts within the window into one flushed alert", () => {
  const out: NormalizedAlert[] = [];
  const agg = new GiftAggregator(2000, (x) => out.push(x));
  agg.add(gift("Carol", 5));
  agg.add(gift("Carol", 15));
  vi.advanceTimersByTime(2000);
  expect(out).toHaveLength(1);
  expect(out[0]).toMatchObject({ displayName: "Carol", count: 20 });
});

it("passes non-gift alerts through immediately", () => {
  const out: NormalizedAlert[] = [];
  const agg = new GiftAggregator(2000, (x) => out.push(x));
  agg.add({ id: "f1", kind: "follow", displayName: "Alice", createdAt: 0 });
  expect(out).toHaveLength(1);
});
