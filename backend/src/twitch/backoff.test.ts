import { describe, it, expect } from "vitest";
import { createBackoff } from "./backoff.js";

describe("createBackoff", () => {
  it("grows geometrically then caps at max", () => {
    const b = createBackoff({ base: 1000, factor: 2, max: 8000, jitter: 0 });
    expect(b.next()).toBe(1000);
    expect(b.next()).toBe(2000);
    expect(b.next()).toBe(4000);
    expect(b.next()).toBe(8000);
    expect(b.next()).toBe(8000);
  });
  it("reset returns to base", () => {
    const b = createBackoff({ base: 1000, factor: 2, jitter: 0 });
    b.next(); b.next();
    b.reset();
    expect(b.next()).toBe(1000);
  });
});
