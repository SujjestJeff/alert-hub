import { describe, it, expect } from "vitest";
import { makeSyntheticAlert } from "./synthetic.js";

describe("makeSyntheticAlert", () => {
  it("gives a cheer its bits", () => expect(makeSyntheticAlert("cheer").bits).toBeGreaterThan(0));
  it("gives a gift its count", () => expect(makeSyntheticAlert("gift").count).toBeGreaterThan(0));
  it("gives a resub its months", () => expect(makeSyntheticAlert("resub").months).toBeGreaterThan(0));
  it("gives a raid its viewer count", () => expect(makeSyntheticAlert("raid").count).toBeGreaterThan(0));
  it("labels every synthetic id with a test- prefix", () =>
    expect(makeSyntheticAlert("follow").id.startsWith("test-")).toBe(true));
});
