import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import { notifications, type NotificationType } from '@/db/schema'
import { z } from 'zod'

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum([
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
  ]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  data: z.record(z.any()).optional(),
  actionUrl: z.string().optional(),
})

/**
 * Get user notifications
 */
export const getUserNotifications = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; limit?: number; unreadOnly?: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      const whereClause = data.unreadOnly
        ? and(eq(notifications.userId, data.userId), eq(notifications.isRead, false))
        : eq(notifications.userId, data.userId)

      const notificationList = await db.query.notifications.findMany({
        where: whereClause,
        orderBy: desc(notifications.createdAt),
        limit: data.limit || 50,
        with: {
          project: true,
        },
      })

      return {
        success: true,
        notifications: notificationList.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          projectId: n.projectId,
          projectTitle: n.project?.title,
          teamId: n.teamId,
          data: n.data ? JSON.parse(n.data) : null,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt.toISOString(),
          readAt: n.readAt?.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get notifications error:', error)
      return { success: false, error: 'Failed to get notifications' }
    }
  })

/**
 * Get unread notification count
 */
export const getUnreadCount = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; projectId?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const whereClause = data.projectId
        ? and(
            eq(notifications.userId, data.userId),
            eq(notifications.isRead, false),
            eq(notifications.projectId, data.projectId)
          )
        : and(
            eq(notifications.userId, data.userId),
            eq(notifications.isRead, false)
          )

      const result = await db
        .select({ count: count() })
        .from(notifications)
        .where(whereClause)

      return {
        success: true,
        count: result[0]?.count || 0,
      }
    } catch (error) {
      console.error('Get unread count error:', error)
      return { success: false, error: 'Failed to get count' }
    }
  })

/**
 * Get unread counts per project
 */
export const getUnreadCountsByProject = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const result = await db
        .select({
          projectId: notifications.projectId,
          count: count(),
        })
        .from(notifications)
        .where(and(
          eq(notifications.userId, data.userId),
          eq(notifications.isRead, false)
        ))
        .groupBy(notifications.projectId)

      const counts: Record<string, number> = {}
      for (const row of result) {
        if (row.projectId) {
          counts[row.projectId] = row.count
        }
      }

      return { success: true, counts }
    } catch (error) {
      console.error('Get unread counts by project error:', error)
      return { success: false, error: 'Failed to get counts' }
    }
  })

/**
 * Mark notification as read
 */
export const markAsRead = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await db.update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(eq(notifications.id, data.notificationId))

      return { success: true }
    } catch (error) {
      console.error('Mark as read error:', error)
      return { success: false, error: 'Failed to mark as read' }
    }
  })

/**
 * Mark all notifications as read
 */
export const markAllAsRead = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; projectId?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const whereClause = data.projectId
        ? and(
            eq(notifications.userId, data.userId),
            eq(notifications.projectId, data.projectId)
          )
        : eq(notifications.userId, data.userId)

      await db.update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
        })
        .where(whereClause)

      return { success: true }
    } catch (error) {
      console.error('Mark all as read error:', error)
      return { success: false, error: 'Failed to mark all as read' }
    }
  })

/**
 * Create notification
 */
export const createNotification = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createNotificationSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const notificationId = uuidv4()

      await db.insert(notifications).values({
        id: notificationId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        projectId: data.projectId,
        teamId: data.teamId,
        data: data.data ? JSON.stringify(data.data) : null,
        actionUrl: data.actionUrl,
        isRead: false,
        createdAt: new Date(),
      })

      return { success: true, notificationId }
    } catch (error) {
      console.error('Create notification error:', error)
      return { success: false, error: 'Failed to create notification' }
    }
  })

/**
 * Delete notification
 */
export const deleteNotification = createServerFn({ method: 'POST' })
  .inputValidator((data: { notificationId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await db.delete(notifications)
        .where(and(
          eq(notifications.id, data.notificationId),
          eq(notifications.userId, data.userId)
        ))

      return { success: true }
    } catch (error) {
      console.error('Delete notification error:', error)
      return { success: false, error: 'Failed to delete notification' }
    }
  })

/**
 * Clear old notifications (older than 30 days)
 */
export const clearOldNotifications = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; daysOld?: number }) => data)
  .handler(async ({ data }) => {
    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - (data.daysOld || 30))

      await db.delete(notifications)
        .where(and(
          eq(notifications.userId, data.userId),
          eq(notifications.isRead, true),
          sql`${notifications.createdAt} < ${cutoff.getTime()}`
        ))

      return { success: true }
    } catch (error) {
      console.error('Clear old notifications error:', error)
      return { success: false, error: 'Failed to clear notifications' }
    }
  })

/**
 * Create batch notifications (for sending to multiple users)
 */
export const createBatchNotifications = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    userIds: string[]
    type: NotificationType
    title: string
    message: string
    projectId?: string
    teamId?: string
    data?: Record<string, any>
    actionUrl?: string
  }) => data)
  .handler(async ({ data }) => {
    try {
      const now = new Date()
      const notificationValues = data.userIds.map(userId => ({
        id: uuidv4(),
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        projectId: data.projectId,
        teamId: data.teamId,
        data: data.data ? JSON.stringify(data.data) : null,
        actionUrl: data.actionUrl,
        isRead: false,
        createdAt: now,
      }))

      await db.insert(notifications).values(notificationValues)

      return { success: true, count: data.userIds.length }
    } catch (error) {
      console.error('Create batch notifications error:', error)
      return { success: false, error: 'Failed to create notifications' }
    }
  })
