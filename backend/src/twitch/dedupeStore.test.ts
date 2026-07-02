import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../db.js";
import { dedupeStore } from "./dedupeStore.js";

beforeEach(() => db.exec(`DELETE FROM seen_messages;`));

describe("dedupeStore", () => {
  it("records and recognizes a seen id (persistence is SQLite's job)", () => {
    expect(dedupeStore.has("m1")).toBe(false);
    dedupeStore.add("m1");
    expect(dedupeStore.has("m1")).toBe(true);
  });
  it("prune drops entries older than the window", () => {
    db.prepare(`INSERT INTO seen_messages (id, ts) VALUES (?, ?)`).run("old", Date.now() - 20 * 60_000);
    dedupeStore.prune(10 * 60_000);
    expect(dedupeStore.has("old")).toBe(false);
  })
})
