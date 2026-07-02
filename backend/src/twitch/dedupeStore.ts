import { db } from "../db.js";

db.exec(`CREATE TABLE IF NOT EXISTS seen_messages (id TEXT PRIMARY KEY, ts INTEGER NOT NULL);`);

const hasStmt = db.prepare(`SELECT 1 FROM seen_messages WHERE id = ?`);
const addStmt = db.prepare(`INSERT OR IGNORE INTO seen_messages (id, ts) VALUES (?, ?)`);
const pruneStmt = db.prepare(`DELETE FROM seen_messages WHERE ts < ?`);

export const dedupeStore = {
  has: (id: string) => hasStmt.get(id) !== undefined,
  add: (id: string) => addStmt.run(id, Date.now()),
  prune: (olderThanMs = 10 * 60_000) => pruneStmt.run(Date.now() - olderThanMs),
};

