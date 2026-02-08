import { createServerFn } from '@tanstack/react-start'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/db'
import { users, userBadges, badges, competencyScores, xpTransactions } from '@/db/schema'
import { z } from 'zod'

// Validation schemas
const getUserSchema = z.object({
  userId: z.string(),
})

const updateUserSchema = z.object({
  userId: z.string(),
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  defaultSessionDifficulty: z.enum(['easy', 'medium', 'hard']).optional(),
})

const addXpSchema = z.object({
  userId: z.string(),
  amount: z.number().int(),
  reason: z.string(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
})

// Level thresholds
const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500]
const LEVEL_NAMES = ['Newcomer', 'Learner', 'Explorer', 'Navigator', 'Pioneer', 'Master']

function calculateLevel(xp: number): { level: number; name: string; progress: number } {
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const progress = Math.min(100, ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
  
  return {
    level,
    name: LEVEL_NAMES[level - 1] || 'Master',
    progress,
  }
}

/**
 * Get user by ID
 */
export const getUser = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return getUserSchema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const levelInfo = calculateLevel(user.xp)

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          xp: user.xp,
          level: levelInfo.level,
          levelName: levelInfo.name,
          levelProgress: levelInfo.progress,
          anonymizedName: user.anonymizedName,
          defaultSessionDifficulty: user.defaultSessionDifficulty,
          createdAt: user.createdAt.toISOString(),
        },
      }
    } catch (error) {
      console.error('Get user error:', error)
      return { success: false, error: 'Failed to get user' }
    }
  })

/**
 * Update user profile
 */
export const updateUser = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return updateUserSchema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const { userId, ...updates } = data
      
      await db.update(users)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      })

      if (!updatedUser) {
        return { success: false, error: 'User not found' }
      }

      const levelInfo = calculateLevel(updatedUser.xp)

      return {
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatarUrl: updatedUser.avatarUrl,
          xp: updatedUser.xp,
          level: levelInfo.level,
          levelName: levelInfo.name,
          defaultSessionDifficulty: updatedUser.defaultSessionDifficulty,
        },
      }
    } catch (error) {
      console.error('Update user error:', error)
      return { success: false, error: 'Failed to update user' }
    }
  })

/**
 * Get user badges
 */
export const getUserBadges = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const earnedBadges = await db
        .select({
          badge: badges,
          earnedAt: userBadges.earnedAt,
          context: userBadges.context,
        })
        .from(userBadges)
        .innerJoin(badges, eq(userBadges.badgeId, badges.id))
        .where(eq(userBadges.userId, data.userId))
        .orderBy(desc(userBadges.earnedAt))

      const allBadges = await db.query.badges.findMany({
        where: eq(badges.isActive, true),
      })

      const earnedIds = new Set(earnedBadges.map(b => b.badge.id))

      return {
        success: true,
        earned: earnedBadges.map(b => ({
          ...b.badge,
          earnedAt: b.earnedAt.toISOString(),
          context: b.context ? JSON.parse(b.context) : null,
        })),
        available: allBadges.filter(b => !earnedIds.has(b.id)),
      }
    } catch (error) {
      console.error('Get user badges error:', error)
      return { success: false, error: 'Failed to get badges' }
    }
  })

/**
 * Get user competency scores
 */
export const getUserCompetencies = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; projectId?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const query = data.projectId
        ? db.query.competencyScores.findMany({
            where: (scores, { and, eq }) => and(
              eq(scores.userId, data.userId),
              eq(scores.projectId, data.projectId!)
            ),
          })
        : db.query.competencyScores.findMany({
            where: eq(competencyScores.userId, data.userId),
          })

      const scores = await query

      return {
        success: true,
        competencies: scores.map(s => ({
          ...s,
          lastCalculatedAt: s.lastCalculatedAt.toISOString(),
          createdAt: s.createdAt.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get user competencies error:', error)
      return { success: false, error: 'Failed to get competencies' }
    }
  })

/**
 * Add XP to user
 */
export const addUserXp = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return addXpSchema.parse(data)
  })
  .handler(async ({ data }) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      const newXp = user.xp + data.amount
      const levelInfo = calculateLevel(newXp)
      const previousLevel = calculateLevel(user.xp).level
      const leveledUp = levelInfo.level > previousLevel

      // Update user XP and level
      await db.update(users)
        .set({
          xp: newXp,
          level: levelInfo.level,
          updatedAt: new Date(),
        })
        .where(eq(users.id, data.userId))

      // Record XP transaction
      await db.insert(xpTransactions).values({
        id: crypto.randomUUID(),
        userId: data.userId,
        amount: data.amount,
        reason: data.reason,
        entityType: data.entityType,
        entityId: data.entityId,
        createdAt: new Date(),
      })

      return {
        success: true,
        xp: newXp,
        level: levelInfo.level,
        levelName: levelInfo.name,
        leveledUp,
      }
    } catch (error) {
      console.error('Add XP error:', error)
      return { success: false, error: 'Failed to add XP' }
    }
  })

/**
 * Get user XP history
 */
export const getUserXpHistory = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    try {
      const transactions = await db.query.xpTransactions.findMany({
        where: eq(xpTransactions.userId, data.userId),
        orderBy: desc(xpTransactions.createdAt),
        limit: data.limit || 50,
      })

      return {
        success: true,
        transactions: transactions.map(t => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get XP history error:', error)
      return { success: false, error: 'Failed to get XP history' }
    }
  })


