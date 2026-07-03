import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'

let db: Database.Database | null = null

export function getDb() {
  if (db) {
    return db
  }

  const dbPath = path.join(app.getPath('userData'), 'app.sqlite')
  db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  return db
}

export function closeDb() {
  db?.close()
  db = null
}
