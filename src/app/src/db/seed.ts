import { db } from './index'
import { users } from './schema'
import { hashPassword } from '../server/auth/password'

async function seed() {
  console.log('Seeding database...')

  const now = new Date()

  // Clear existing users
  console.log('Clearing existing users...')
  await db.delete(users)

  // Create users
  console.log('Creating users...')
  // All demo users use 'supersecret!' as password for E2E testing
  const passwordHash = await hashPassword('supersecret!')

  const userRecords = [
    // Simple test accounts
    {
      id: 'user_admin',
      email: 'admin@p3bl.local',
      passwordHash,
      name: 'Admin User',
      role: 'admin' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Admin_001',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_creator1',
      email: 'creator1@p3bl.local',
      passwordHash,
      name: 'Creator One',
      role: 'creator' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Creator_001',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_creator2',
      email: 'creator2@p3bl.local',
      passwordHash,
      name: 'Creator Two',
      role: 'creator' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Creator_002',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_creator3',
      email: 'creator3@p3bl.local',
      passwordHash,
      name: 'Creator Three',
      role: 'creator' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Creator_003',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_explorer1',
      email: 'explorer1@p3bl.local',
      passwordHash,
      name: 'Explorer One',
      role: 'explorer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Explorer_001',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_explorer2',
      email: 'explorer2@p3bl.local',
      passwordHash,
      name: 'Explorer Two',
      role: 'explorer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Explorer_002',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_explorer3',
      email: 'explorer3@p3bl.local',
      passwordHash,
      name: 'Explorer Three',
      role: 'explorer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Explorer_003',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'user_pioneer1',
      email: 'pioneer1@p3bl.local',
      passwordHash,
      name: 'Pioneer One',
      role: 'pioneer' as const,
      xp: 0,
      level: 1,
      avatarUrl: null,
      anonymizedName: 'Pioneer_001',
      createdAt: now,
      updatedAt: now,
    },
  ]

  await db.insert(users).values(userRecords)

  console.log('Seeded users (password: supersecret!):')
  for (const user of userRecords) {
    console.log(`- ${user.email} (${user.role})`)
  }

  console.log('Seed completed successfully!')
}

seed().catch(console.error)
