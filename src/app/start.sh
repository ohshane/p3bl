rm ./data/p3bl.db
rm -rf ./drizzle

pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed

pnpm run dev