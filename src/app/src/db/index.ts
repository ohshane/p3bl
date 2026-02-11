import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { join } from 'path'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

// Database file path - relative to app root
const DB_PATH = process.env.DATABASE_URL || join(process.cwd(), 'data', 'p3bl.db')

// Create database directory if it doesn't exist
const dbDir = dirname(DB_PATH)
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true })
}

// Create libsql client (pure JS, no native compilation needed)
export const client = createClient({
  url: `file:${DB_PATH}`,
})

// Enable WAL mode for better concurrent access
client.execute('PRAGMA journal_mode = WAL')

// Enable foreign keys
client.execute('PRAGMA foreign_keys = ON')

// Create Drizzle instance with schema
export const db = drizzle(client, { schema })

// Export schema for use in queries
export { schema }

// Export types
export type Database = typeof db
