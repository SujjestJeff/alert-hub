import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { dirname, resolve } from 'path'

let _db: Database.Database | null = null

export function openDatabase(path: string): Database.Database {
  const absPath = resolve(path)
  mkdirSync(dirname(absPath), { recursive: true })

  const db = new Database(absPath)
  db.pragma('journal_mode = WAL')

  runMigrations(db)

  _db = db
  return db
}

export function getDatabase(): Database.Database {
  if (!_db) throw new Error('Database not initialized — call openDatabase first')
  return _db
}

function runMigrations(db: Database.Database): void {
  // Episode N: replace this no-op with real migration steps
  db.exec('SELECT 1')
}
