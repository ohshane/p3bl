/**
 * @vitest-environment node
 *
 * Integration tests for notifications API functions
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import {
  setupTestDb,
  closeTestDb,
  clearTestDb,
  createTestUser,
  createTestProject,
  getTestDb,
} from '../setup'
import * as schema from '@/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

describe('Notifications API', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    closeTestDb()
  })

  beforeEach(() => {
    clearTestDb()
  })

  describe('Notification CRUD', () => {
    it('should create notification', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      const notificationId = uuidv4()

      await db.insert(schema.notifications).values({
        id: notificationId,
        userId: explorer.id,
        type: 'badge_earned',
        title: 'Badge Earned!',
        message: 'You earned the "First Steps" badge!',
        isRead: false,
        createdAt: new Date(),
      })

      const notification = await db.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId),
      })

      expect(notification).toBeDefined()
      expect(notification!.type).toBe('badge_earned')
      expect(notification!.title).toBe('Badge Earned!')
      expect(notification!.isRead).toBe(false)
    })

    it('should get user notifications', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      const now = Date.now()

      await db.insert(schema.notifications).values([
        {
          id: uuidv4(),
          userId: explorer.id,
          type: 'badge_earned',
          title: 'Badge 1',
          message: 'You earned a badge!',
          isRead: false,
          createdAt: new Date(now - 2000),
        },
        {
          id: uuidv4(),
          userId: explorer.id,
          type: 'level_up',
          title: 'Level Up!',
          message: 'You reached level 2!',
          isRead: true,
          createdAt: new Date(now - 1000),
        },
        {
          id: uuidv4(),
          userId: explorer.id,
          type: 'new_feedback',
          title: 'New Feedback',
          message: 'You have new feedback on your artifact.',
          isRead: false,
          createdAt: new Date(now),
        },
      ])

      const notifications = await db.query.notifications.findMany({
        where: eq(schema.notifications.userId, explorer.id),
        orderBy: desc(schema.notifications.createdAt),
      })

      expect(notifications).toHaveLength(3)
      expect(notifications[0].type).toBe('new_feedback') // Most recent
    })

    it('should get unread notifications only', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      await db.insert(schema.notifications).values([
        {
          id: uuidv4(),
          userId: explorer.id,
          type: 'badge_earned',
          title: 'Unread 1',
          message: 'Message 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          userId: explorer.id,
          type: 'level_up',
          title: 'Read',
          message: 'Message 2',
          isRead: true,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          userId: explorer.id,
          type: 'new_feedback',
          title: 'Unread 2',
          message: 'Message 3',
          isRead: false,
          createdAt: new Date(),
        },
      ])

      const unread = await db.query.notifications.findMany({
        where: and(
          eq(schema.notifications.userId, explorer.id),
          eq(schema.notifications.isRead, false)
        ),
      })

      expect(unread).toHaveLength(2)
    })
  })

  describe('Unread Counts', () => {
    it('should get total unread count', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      await db.insert(schema.notifications).values([
        { id: uuidv4(), userId: explorer.id, type: 'badge_earned', title: 'N1', message: 'M1', isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'level_up', title: 'N2', message: 'M2', isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N3', message: 'M3', isRead: true, createdAt: new Date() },
      ])

      const result = await db
        .select({ count: count() })
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, explorer.id),
          eq(schema.notifications.isRead, false)
        ))

      expect(result[0].count).toBe(2)
    })

    it('should get unread counts per project', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project1 = await createTestProject(creator.id, { title: 'Project 1' })
      const project2 = await createTestProject(creator.id, { title: 'Project 2' })

      await db.insert(schema.notifications).values([
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N1', message: 'M1', projectId: project1.id, isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N2', message: 'M2', projectId: project1.id, isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N3', message: 'M3', projectId: project2.id, isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N4', message: 'M4', projectId: project1.id, isRead: true, createdAt: new Date() },
      ])

      const result = await db
        .select({
          projectId: schema.notifications.projectId,
          count: count(),
        })
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, explorer.id),
          eq(schema.notifications.isRead, false)
        ))
        .groupBy(schema.notifications.projectId)

      const counts: Record<string, number> = {}
      for (const row of result) {
        if (row.projectId) {
          counts[row.projectId] = row.count
        }
      }

      expect(counts[project1.id]).toBe(2)
      expect(counts[project2.id]).toBe(1)
    })
  })

  describe('Mark as Read', () => {
    it('should mark single notification as read', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      const notificationId = uuidv4()

      await db.insert(schema.notifications).values({
        id: notificationId,
        userId: explorer.id,
        type: 'badge_earned',
        title: 'Badge',
        message: 'Message',
        isRead: false,
        createdAt: new Date(),
      })

      await db.update(schema.notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(schema.notifications.id, notificationId))

      const notification = await db.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId),
      })

      expect(notification!.isRead).toBe(true)
      expect(notification!.readAt).not.toBeNull()
    })

    it('should mark all notifications as read', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      await db.insert(schema.notifications).values([
        { id: uuidv4(), userId: explorer.id, type: 'badge_earned', title: 'N1', message: 'M1', isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'level_up', title: 'N2', message: 'M2', isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N3', message: 'M3', isRead: false, createdAt: new Date() },
      ])

      await db.update(schema.notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(schema.notifications.userId, explorer.id))

      const unread = await db.query.notifications.findMany({
        where: and(
          eq(schema.notifications.userId, explorer.id),
          eq(schema.notifications.isRead, false)
        ),
      })

      expect(unread).toHaveLength(0)
    })

    it('should mark all notifications for specific project as read', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project1 = await createTestProject(creator.id)
      const project2 = await createTestProject(creator.id)

      await db.insert(schema.notifications).values([
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N1', message: 'M1', projectId: project1.id, isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N2', message: 'M2', projectId: project1.id, isRead: false, createdAt: new Date() },
        { id: uuidv4(), userId: explorer.id, type: 'new_feedback', title: 'N3', message: 'M3', projectId: project2.id, isRead: false, createdAt: new Date() },
      ])

      await db.update(schema.notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(and(
          eq(schema.notifications.userId, explorer.id),
          eq(schema.notifications.projectId, project1.id)
        ))

      // Project 1 should be read
      const project1Unread = await db.query.notifications.findMany({
        where: and(
          eq(schema.notifications.projectId, project1.id),
          eq(schema.notifications.isRead, false)
        ),
      })
      expect(project1Unread).toHaveLength(0)

      // Project 2 should still be unread
      const project2Unread = await db.query.notifications.findMany({
        where: and(
          eq(schema.notifications.projectId, project2.id),
          eq(schema.notifications.isRead, false)
        ),
      })
      expect(project2Unread).toHaveLength(1)
    })
  })

  describe('Delete Notifications', () => {
    it('should delete single notification', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      const notificationId = uuidv4()

      await db.insert(schema.notifications).values({
        id: notificationId,
        userId: explorer.id,
        type: 'badge_earned',
        title: 'To Delete',
        message: 'Message',
        isRead: false,
        createdAt: new Date(),
      })

      await db.delete(schema.notifications)
        .where(and(
          eq(schema.notifications.id, notificationId),
          eq(schema.notifications.userId, explorer.id)
        ))

      const deleted = await db.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId),
      })

      expect(deleted).toBeUndefined()
    })
  })

  describe('Batch Notifications', () => {
    it('should create notifications for multiple users', async () => {
      const db = getTestDb()
      const explorer1 = await createTestUser({ role: 'explorer' })
      const explorer2 = await createTestUser({ role: 'explorer' })
      const explorer3 = await createTestUser({ role: 'explorer' })

      const userIds = [explorer1.id, explorer2.id, explorer3.id]
      const now = new Date()

      const notifications = userIds.map(userId => ({
        id: uuidv4(),
        userId,
        type: 'system' as const,
        title: 'System Update',
        message: 'The platform will be updated tonight.',
        isRead: false,
        createdAt: now,
      }))

      await db.insert(schema.notifications).values(notifications)

      const allNotifications = await db.query.notifications.findMany({
        where: eq(schema.notifications.type, 'system'),
      })

      expect(allNotifications).toHaveLength(3)
    })
  })

  describe('Notification Types', () => {
    it('should support all notification types', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      const types = [
        'new_feedback',
        'review_complete',
        'session_unlocked',
        'deadline_reminder',
        'team_message',
        'badge_earned',
        'level_up',
        'project_invitation',
        'ai_intervention',
        'system',
      ] as const

      const notifications = types.map((type, index) => ({
        id: uuidv4(),
        userId: explorer.id,
        type,
        title: `Title ${index}`,
        message: `Message ${index}`,
        isRead: false,
        createdAt: new Date(),
      }))

      await db.insert(schema.notifications).values(notifications)

      const all = await db.query.notifications.findMany({
        where: eq(schema.notifications.userId, explorer.id),
      })

      expect(all).toHaveLength(11)
      expect(new Set(all.map(n => n.type)).size).toBe(11)
    })
  })

  describe('Notification with Project Context', () => {
    it('should create notification linked to project', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id, { title: 'ML Project' })

      await db.insert(schema.notifications).values({
        id: uuidv4(),
        userId: explorer.id,
        type: 'new_feedback',
        title: 'New Feedback',
        message: 'You have new feedback on your artifact.',
        projectId: project.id,
        actionUrl: `/projects/${project.id}/artifacts`,
        isRead: false,
        createdAt: new Date(),
      })

      const notification = await db.query.notifications.findFirst({
        where: eq(schema.notifications.userId, explorer.id),
        with: { project: true },
      })

      expect(notification).toBeDefined()
      expect(notification!.project?.title).toBe('ML Project')
      expect(notification!.actionUrl).toContain(project.id)
    })
  })
})
