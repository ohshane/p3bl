#!/bin/bash
set -e

# Ensure data directory exists
mkdir -p ./data

# Remove old database (if any) for a clean start
rm -f ./data/p3bl.db ./data/p3bl.db-shm ./data/p3bl.db-wal

# Run migrations (migration files are checked into ./drizzle/)
pnpm run db:migrate

# Seed the database
pnpm run db:seed

# Start the dev server
pnpm run dev --host 0.0.0.0
