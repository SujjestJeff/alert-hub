import { describe, it, expect } from "vitest";
import { applyTemplate } from "./template.js";

describe("applyTemplate", () => {
  it("substitutes {name} from displayName", () => {
    expect(applyTemplate("{name} followed!", { displayName: "Alice" })).toBe("Alice followed!");
  });
  it("substitues multiple fields", () => {
    expect(applyTemplate("{name} gifted {count} subs!", { displayName: "Bob", count: 20 }))
      .toBe("Bob gifted 20 subs!");
  });
  it("renders missing fields as empty string, not 'undefined'", () => {
    expect(applyTemplate("{name} - {message}", { displayName: "Dee" })).toBe("Dee - ");
  });
});
