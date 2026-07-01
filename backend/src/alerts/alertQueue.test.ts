import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AlertQueue } from "./alertQueue.js";
import type { NormalizedAlert } from "./types.js";

const a = (id: string): NormalizedAlert => ({ id, kind: "follow", displayName: id, createdAt: 0 });


beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("AlertQueue", () => {
  it("plays one at a time; the second waits for the first to finish", () => {
    const q = new AlertQueue({ maxDurationMs: 8000, gapMs: 500 });
    const played: string[] = [];
    q.on("play", (x) => played.push(x.id));

    q.enqueue(a("one"));
    q.enqueue(a("two"));
    expect(played).toEqual(["one"]);

    q.markDone("one");
    vi.advanceTimersByTime(500);
    expect(played).toEqual(["one", "two"]);
  });

  it("advances on the safety timeout of markDone never comes", () => {
    const q = new AlertQueue({ maxDurationMs: 8000, gapMs: 500 });
    const played: string[] = [];
    q.on("play", (x) => played.push(x.id));

    q.enqueue(a("one"));
    q.enqueue(a("two"));
    vi.advanceTimersByTime(8000 + 500);
    expect(played).toEqual(["one", "two"]);
  });

  it("ignores a stale markDone for an alert that isn't current", () => {
    const q = new AlertQueue({ maxDurationMs: 8000, gapMs: 500 });
    const played: string[] = [];
    q.on("play", (x) => played.push(x.id));

    q.enqueue(a("one"));
    q.markDone("two");
    expect(played).toEqual(["one"]);
  });
});
