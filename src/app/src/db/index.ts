import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { join } from 'path'

// Database file path - relative to app root
const DB_PATH = process.env.DATABASE_URL || join(process.cwd(), 'data', 'p3bl.db')

// Create database directory if it doesn't exist
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const dbDir = dirname(DB_PATH)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

// Create SQLite connection
export const sqlite = new Database(DB_PATH)

// Enable WAL mode for better concurrent access
sqlite.pragma('journal_mode = WAL')

// Enable foreign keys
sqlite.pragma('foreign_keys = ON')

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema })

// Export schema for use in queries
export { schema }

// Export types
export type Database = typeof db
