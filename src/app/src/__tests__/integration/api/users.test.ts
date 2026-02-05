/**
 * @vitest-environment node
 *
 * Integration tests for users API functions
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import {
  setupTestDb,
  closeTestDb,
  clearTestDb,
  createTestUser,
  createTestBadge,
  createTestProject,
  getTestDb,
} from '../setup'
import * as schema from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

describe('Users API', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    closeTestDb()
  })

  beforeEach(() => {
    clearTestDb()
  })

  describe('User CRUD', () => {
    it('should get user by ID', async () => {
      const db = getTestDb()
      const user = await createTestUser({
        name: 'Test User',
        email: 'test@example.com',
        role: 'explorer',
      })

      const dbUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
      })

      expect(dbUser).toBeDefined()
      expect(dbUser!.name).toBe('Test User')
      expect(dbUser!.email).toBe('test@example.com')
      expect(dbUser!.role).toBe('explorer')
    })

    it('should update user profile', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      await db.update(schema.users)
        .set({
          name: 'Updated Name',
          avatarUrl: 'https://example.com/avatar.png',
          hallOfFameOptIn: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id))

      const updatedUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
      })

      expect(updatedUser!.name).toBe('Updated Name')
      expect(updatedUser!.avatarUrl).toBe('https://example.com/avatar.png')
      expect(updatedUser!.hallOfFameOptIn).toBe(true)
    })

    it('should list users by role', async () => {
      const db = getTestDb()

      await createTestUser({ role: 'explorer' })
      await createTestUser({ role: 'explorer' })
      await createTestUser({ role: 'creator' })
      await createTestUser({ role: 'admin' })

      const explorers = await db.query.users.findMany({
        where: eq(schema.users.role, 'explorer'),
      })

      const creators = await db.query.users.findMany({
        where: eq(schema.users.role, 'creator'),
      })

      expect(explorers).toHaveLength(2)
      expect(creators).toHaveLength(1)
    })
  })

  describe('User Badges', () => {
    it('should award badge to user', async () => {
      const db = getTestDb()
      const user = await createTestUser()
      const badge = await createTestBadge({ name: 'First Steps', category: 'learning' })

      await db.insert(schema.userBadges).values({
        id: uuidv4(),
        userId: user.id,
        badgeId: badge.id,
        earnedAt: new Date(),
        context: JSON.stringify({ reason: 'Completed first project' }),
      })

      const userBadges = await db
        .select({
          badge: schema.badges,
          earnedAt: schema.userBadges.earnedAt,
          context: schema.userBadges.context,
        })
        .from(schema.userBadges)
        .innerJoin(schema.badges, eq(schema.userBadges.badgeId, schema.badges.id))
        .where(eq(schema.userBadges.userId, user.id))

      expect(userBadges).toHaveLength(1)
      expect(userBadges[0].badge.name).toBe('First Steps')
      expect(JSON.parse(userBadges[0].context!).reason).toBe('Completed first project')
    })

    it('should get earned and available badges', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      // Create multiple badges
      const badge1 = await createTestBadge({ name: 'Badge 1' })
      const badge2 = await createTestBadge({ name: 'Badge 2' })
      const badge3 = await createTestBadge({ name: 'Badge 3' })

      // Award only badge1 and badge2
      await db.insert(schema.userBadges).values([
        { id: uuidv4(), userId: user.id, badgeId: badge1.id, earnedAt: new Date() },
        { id: uuidv4(), userId: user.id, badgeId: badge2.id, earnedAt: new Date() },
      ])

      // Get all badges
      const allBadges = await db.query.badges.findMany({
        where: eq(schema.badges.isActive, true),
      })

      // Get earned badges
      const earnedBadges = await db.query.userBadges.findMany({
        where: eq(schema.userBadges.userId, user.id),
      })

      const earnedIds = new Set(earnedBadges.map(b => b.badgeId))
      const availableBadges = allBadges.filter(b => !earnedIds.has(b.id))

      expect(earnedBadges).toHaveLength(2)
      expect(availableBadges).toHaveLength(1)
      expect(availableBadges[0].name).toBe('Badge 3')
    })
  })

  describe('User XP and Leveling', () => {
    it('should add XP to user', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      const xpToAdd = 150

      // Record XP transaction
      await db.insert(schema.xpTransactions).values({
        id: uuidv4(),
        userId: user.id,
        amount: xpToAdd,
        reason: 'Completed session',
        entityType: 'session',
        entityId: 'session-1',
        createdAt: new Date(),
      })

      // Update user XP
      const currentUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
      })

      const newXp = currentUser!.xp + xpToAdd

      await db.update(schema.users)
        .set({
          xp: newXp,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, user.id))

      const updatedUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
      })

      expect(updatedUser!.xp).toBe(150)
    })

    it('should track XP history', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      // Add multiple XP transactions
      await db.insert(schema.xpTransactions).values([
        {
          id: uuidv4(),
          userId: user.id,
          amount: 50,
          reason: 'Daily login',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
          id: uuidv4(),
          userId: user.id,
          amount: 100,
          reason: 'Completed session',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
          id: uuidv4(),
          userId: user.id,
          amount: 75,
          reason: 'Artifact submitted',
          createdAt: new Date(), // now
        },
      ])

      const history = await db.query.xpTransactions.findMany({
        where: eq(schema.xpTransactions.userId, user.id),
        orderBy: desc(schema.xpTransactions.createdAt),
      })

      expect(history).toHaveLength(3)
      expect(history[0].amount).toBe(75) // Most recent
      expect(history[0].reason).toBe('Artifact submitted')

      // Calculate total
      const totalXp = history.reduce((sum, t) => sum + t.amount, 0)
      expect(totalXp).toBe(225)
    })
  })

  describe('User Competencies', () => {
    it('should store and retrieve competency scores', async () => {
      const db = getTestDb()
      const user = await createTestUser({ role: 'creator' })
      const project = await createTestProject(user.id)

      // Create competency scores
      await db.insert(schema.competencyScores).values([
        {
          id: uuidv4(),
          userId: user.id,
          projectId: project.id,
          competency: 'critical_thinking',
          score: 85,
          lastCalculatedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          userId: user.id,
          projectId: project.id,
          competency: 'collaboration',
          score: 78,
          lastCalculatedAt: new Date(),
          createdAt: new Date(),
        },
      ])

      // Get scores for project
      const scores = await db.query.competencyScores.findMany({
        where: eq(schema.competencyScores.projectId, project.id),
      })

      expect(scores).toHaveLength(2)
      expect(scores.find(s => s.competency === 'critical_thinking')?.score).toBe(85)
      expect(scores.find(s => s.competency === 'collaboration')?.score).toBe(78)
    })

    it('should update competency score over time', async () => {
      const db = getTestDb()
      const user = await createTestUser({ role: 'creator' })
      const project = await createTestProject(user.id)

      const competencyId = uuidv4()

      // Initial score
      await db.insert(schema.competencyScores).values({
        id: competencyId,
        userId: user.id,
        projectId: project.id,
        competency: 'problem_solving',
        score: 60,
        lastCalculatedAt: new Date(),
        createdAt: new Date(),
      })

      // Update with new score
      await db.update(schema.competencyScores)
        .set({
          score: 75,
          lastCalculatedAt: new Date(),
        })
        .where(eq(schema.competencyScores.id, competencyId))

      const updated = await db.query.competencyScores.findFirst({
        where: eq(schema.competencyScores.id, competencyId),
      })

      expect(updated!.score).toBe(75)
    })
  })
})
