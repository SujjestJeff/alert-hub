import { describe, it, expect } from "vitest";
import { formatSSE, tokensMatch } from "./sse.js";

describe("formatSSE", () => {
  it("frames a named event with JSON data and a blank-line terminator", () => {
    expect(formatSSE("alert", { kind: "follow" }))
      .toBe(`event: alert\ndata: {"kind":"follow"}\n\n`);
  });
});

describe("tokensMatch", () => {
  it("accepts an exact match", () => expect(tokensMatch("abc123", "abc123")).toBe(true));
  it("rejects a mismatch", () => expect(tokensMatch("abc123", "nope")).toBe(false));
  it("rejects on length mismatch without throwing", () =>
    expect(tokensMatch("short", "muchlongertoken")).toBe(false));
  it("rejects a missing/undefined token", () => {
    expect(tokensMatch(undefined, "abc123")).toBe(false);
    expect(tokensMatch("abc123", undefined)).toBe(false);
  });
});
