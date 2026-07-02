import { describe, it, expect } from "vitest";
import { shouldAlert } from "./shouldAlert.js";
const cfg = (o = {}) => ({ enabled: true, template: "x", sound: null, image: null, holdMs: 3000, minAmount: 0, ...o });

describe("shouldAlert", () => {
  it("blocks disabled kinds", () =>
    expect(shouldAlert({ id: "1", kind: "follow", displayName: "A", createdAt: 0 },
      cfg({ enabled: false }))).toBe(false));
  it("passes a follow when enabled (no numeric gate)", () =>
    expect(shouldAlert({ id: "1", kind: "follow", displayName: "A", createdAt: 0 },
      cfg())).toBe(true));
  it("filters a cheer below the bit threshold", () =>
    expect(shouldAlert({ id: "1", kind: "cheer", displayName: "A", createdAt: 0, bits: 50 },
      cfg({ minAmount: 100 }))).toBe(false));
  it("passes a cheer at/above the threshold", () =>
    expect(shouldAlert({ id: "1", kind: "cheer", displayName: "A", createdAt: 0, bits: 100 },
      cfg({ minAmount: 100 }))).toBe(true));
});
