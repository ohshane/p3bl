import { defineConfig } from 'drizzle-kit'
import { join } from 'path'

const DB_PATH = process.env.DATABASE_URL || join(process.cwd(), 'data', 'p3bl.db')

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${DB_PATH}`,
  },
  verbose: true,
  strict: true,
})
