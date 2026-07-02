import { describe, it, expect } from "vitest";
import { AlertConfigSchema } from "./schema.js";

const valid = { enabled: true, template: "{name}!", sound: null, image: null, holdMs: 3000, minAmount: 0 };

describe("AlertConfigSchema", () => {
  it("accepts a valid config", () => expect(() => AlertConfigSchema.parse(valid)).not.toThrow());
  it("rejects an empty template", () => expect(() => AlertConfigSchema.parse({ ...valid, template: "" })).toThrow());
  it("rejects out-of-range holdMs", () => expect(() => AlertConfigSchema.parse({ ...valid, holdMs: 99 })).toThrow());
  it("rejects a negative threshold", () => expect(() => AlertConfigSchema.parse({ ...valid, minAmount: -1 })).toThrow());
})
