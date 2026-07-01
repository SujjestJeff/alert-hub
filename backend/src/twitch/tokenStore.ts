import { db } from "../db.js";

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
}

const ROW_ID = "broadcaster";

const selectStmt = db.prepare(`SELECT * FROM tokens WHERE id = ?`);
const upsertStmt = db.prepare(`
  INSERT INTO tokens (id, access_token, refresh_token, expires_at, scopes, updated_at)
  VALUES (@id, @access_token, @refresh_token, @expires_at, @scopes, @updated_at)
  ON CONFLICT(ID) DO UPDATE SET
    access_token  = excluded.access_token,
    refresh_token = excluded.refresh_token,
    expires_at    = excluded.expires_at,
    scopes        = excluded.scopes,
    updated_at    = excluded.updated_at
`);
const deleteStmt = db.prepare(`DELETE FROM tokens WHERE id = ?`);

export function loadTokens(): TokenSet | null {
  const row = selectStmt.get(ROW_ID) as any;
  if (!row) return null;
  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    scopes: JSON.parse(row.scopes),
  };
}

export function saveTokens(t: TokenSet): void {
  upsertStmt.run({
    id: ROW_ID,
    access_token: t.accessToken,
    refresh_token: t.refreshToken,
    expires_at: t.expiresAt,
    scopes: JSON.stringify(t.scopes),
    updated_at: Date.now(),
  });
}

export function clearTokens(): void {
  deleteStmt.run(ROW_ID);
}
