import { describe, it, expect } from "vitest";
import { applyTemplate } from "./template.js";
import { makeSampleAlert } from "./kinds.js";

describe("preview parity", () => {
  it("a sample gift renders through applyTemplate exactly like a real one would", () => {
    const out = applyTemplate("{name} gifted {count} subs!", makeSampleAlert("gift"));
    expect(out).toBe("TestUser gifted 5 subs!");
  });
});
