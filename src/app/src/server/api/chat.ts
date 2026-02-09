import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, gt, lt, asc } from 'drizzle-orm'
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid'
import { db } from '@/db'
import {
  chatMessages,
  chatRooms,
  chatRoomMembers,
  messageReactions,
  floatingBotMessages,
  teams,
  aiPersonas,
} from '@/db/schema'
import { z } from 'zod'

// Validation schemas
const sendMessageSchema = z.object({
  roomId: z.string(),
  userId: z.string().optional(), // null for AI messages
  personaId: z.string().optional(), // for AI messages
  content: z.string().min(1).max(10000),
  type: z.enum(['text', 'artifact_share', 'system', 'ai_intervention']).default('text'),
  metadata: z.record(z.string(), z.any()).optional(),
  replyToId: z.string().optional(),
})

const getMessagesSchema = z.object({
  roomId: z.string(),
  limit: z.number().int().min(1).max(100).default(50),
  before: z.string().optional(), // message ID to paginate before
  after: z.string().optional(), // message ID to paginate after
})

const getOrCreateRoomSchema = z.object({
  projectId: z.string(),
  teamId: z.string(),
  userId: z.string(),
  roomName: z.string().optional(),
})

// Stable namespace for deriving a deterministic room ID from project+team.
const TEAM_CHAT_ROOM_NAMESPACE = '2be24c77-8d1e-4b80-85c4-c45ae914f2f2'

/**
 * Get or create a chat room for a team within a project.
 * Each team gets its own chat room. Adds the user as a member if not already in the room.
 */
export const getOrCreateRoom = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => getOrCreateRoomSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Fetch all candidate rooms in deterministic order.
      // If legacy duplicates exist, everyone will consistently pick the same room.
      const existingRooms = await db.query.chatRooms.findMany({
        where: and(
          eq(chatRooms.projectId, data.projectId),
          eq(chatRooms.teamId, data.teamId),
        ),
        orderBy: asc(chatRooms.createdAt),
      })

      let roomId: string
      let roomName: string

      if (existingRooms.length > 0) {
        const canonical = existingRooms[0]
        roomId = canonical.id
        roomName = canonical.name
        if (existingRooms.length > 1) {
          console.warn('[chat-room] duplicate rooms detected, using canonical room', {
            projectId: data.projectId,
            teamId: data.teamId,
            canonicalRoomId: roomId,
            duplicateRoomIds: existingRooms.slice(1).map(r => r.id),
          })
        }
      } else {
        // Create a deterministic room ID so concurrent first-join requests
        // cannot create divergent rooms for the same team/project.
        roomId = uuidv5(`${data.projectId}:${data.teamId}`, TEAM_CHAT_ROOM_NAMESPACE)
        roomName = data.roomName || 'Group Chat'
        const now = new Date()
        await db.insert(chatRooms)
          .values({
            id: roomId,
            projectId: data.projectId,
            teamId: data.teamId,
            name: roomName,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoNothing()
      }

      // Ensure the user is a member of this room.
      // Use upsert-like semantics to avoid race failures on concurrent joins.
      await db.insert(chatRoomMembers)
        .values({
          roomId,
          userId: data.userId,
          joinedAt: new Date(),
        })
        .onConflictDoNothing()

      return {
        success: true,
        room: {
          id: roomId,
          projectId: data.projectId,
          teamId: data.teamId,
          name: roomName,
        },
      }
    } catch (error) {
      console.error('Get or create room error:', error)
      return { success: false, error: 'Failed to get or create room' }
    }
  })

/**
 * Send a message to a room
 */
export const sendMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => sendMessageSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const messageId = uuidv4()
      const now = new Date()

      await db.insert(chatMessages).values({
        id: messageId,
        roomId: data.roomId,
        userId: data.userId,
        personaId: data.personaId,
        content: data.content,
        type: data.type,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        replyToId: data.replyToId,
        isEdited: false,
        createdAt: now,
        updatedAt: now,
      })

      // Get the full message with relations
      const message = await db.query.chatMessages.findFirst({
        where: eq(chatMessages.id, messageId),
        with: {
          user: true,
          persona: true,
          replyTo: {
            with: {
              user: true,
              persona: true,
            },
          },
        },
      })

      return {
        success: true,
        message: message ? {
          id: message.id,
          content: message.content,
          type: message.type,
          metadata: message.metadata ? JSON.parse(message.metadata) : null,
          createdAt: message.createdAt.toISOString(),
          sender: message.user
            ? {
                id: message.user.id,
                name: message.user.name,
                avatarUrl: message.user.avatarUrl,
                type: 'user' as const,
              }
            : message.persona
            ? {
                id: message.persona.id,
                name: message.persona.name,
                avatar: message.persona.avatar,
                type: 'ai' as const,
                personaType: message.persona.type,
              }
            : null,
          replyTo: message.replyTo
            ? {
                id: message.replyTo.id,
                content: message.replyTo.content.substring(0, 100),
                senderName: message.replyTo.user?.name || message.replyTo.persona?.name || 'Unknown',
              }
            : null,
        } : null,
      }
    } catch (error) {
      console.error('Send message error:', error)
      return { success: false, error: 'Failed to send message' }
    }
  })

/**
 * Get messages for a room
 */
export const getMessages = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => getMessagesSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Build where clause for pagination
      let whereClause = eq(chatMessages.roomId, data.roomId)

      if (data.before) {
        const beforeMsg = await db.query.chatMessages.findFirst({
          where: eq(chatMessages.id, data.before),
        })
        if (beforeMsg) {
          whereClause = and(
            eq(chatMessages.roomId, data.roomId),
            lt(chatMessages.createdAt, beforeMsg.createdAt)
          )!
        }
      }

      if (data.after) {
        const afterMsg = await db.query.chatMessages.findFirst({
          where: eq(chatMessages.id, data.after),
        })
        if (afterMsg) {
          whereClause = and(
            eq(chatMessages.roomId, data.roomId),
            gt(chatMessages.createdAt, afterMsg.createdAt)
          )!
        }
      }

      const messages = await db.query.chatMessages.findMany({
        where: whereClause,
        orderBy: desc(chatMessages.createdAt),
        limit: data.limit,
        with: {
          user: true,
          persona: true,
          replyTo: {
            with: {
              user: true,
              persona: true,
            },
          },
          reactions: {
            with: {
              user: true,
            },
          },
        },
      })

      // Reverse to get chronological order
      const orderedMessages = messages.reverse()

      return {
        success: true,
        messages: orderedMessages.map(m => ({
          id: m.id,
          content: m.content,
          type: m.type,
          metadata: m.metadata ? JSON.parse(m.metadata) : null,
          isEdited: m.isEdited,
          createdAt: m.createdAt.toISOString(),
          sender: m.user
            ? {
                id: m.user.id,
                name: m.user.name,
                avatarUrl: m.user.avatarUrl,
                type: 'user' as const,
              }
            : m.persona
            ? {
                id: m.persona.id,
                name: m.persona.name,
                avatar: m.persona.avatar,
                type: 'ai' as const,
                personaType: m.persona.type,
              }
            : null,
          replyTo: m.replyTo
            ? {
                id: m.replyTo.id,
                content: m.replyTo.content.substring(0, 100),
                senderName: m.replyTo.user?.name || m.replyTo.persona?.name || 'Unknown',
              }
            : null,
          reactions: m.reactions.map(r => ({
            emoji: r.emoji,
            userId: r.user.id,
            userName: r.user.name,
          })),
        })),
        hasMore: messages.length === data.limit,
      }
    } catch (error) {
      console.error('Get messages error:', error)
      return { success: false, error: 'Failed to get messages' }
    }
  })

/**
 * Edit message
 */
export const editMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: { messageId: string; userId: string; content: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify user owns the message
      const message = await db.query.chatMessages.findFirst({
        where: and(
          eq(chatMessages.id, data.messageId),
          eq(chatMessages.userId, data.userId)
        ),
      })

      if (!message) {
        return { success: false, error: 'Message not found or not authorized' }
      }

      await db.update(chatMessages)
        .set({
          content: data.content,
          isEdited: true,
          updatedAt: new Date(),
        })
        .where(eq(chatMessages.id, data.messageId))

      return { success: true }
    } catch (error) {
      console.error('Edit message error:', error)
      return { success: false, error: 'Failed to edit message' }
    }
  })

/**
 * Delete message
 */
export const deleteMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: { messageId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify user owns the message
      const message = await db.query.chatMessages.findFirst({
        where: and(
          eq(chatMessages.id, data.messageId),
          eq(chatMessages.userId, data.userId)
        ),
      })

      if (!message) {
        return { success: false, error: 'Message not found or not authorized' }
      }

      await db.delete(chatMessages)
        .where(eq(chatMessages.id, data.messageId))

      return { success: true }
    } catch (error) {
      console.error('Delete message error:', error)
      return { success: false, error: 'Failed to delete message' }
    }
  })

/**
 * Add reaction to message
 */
export const addReaction = createServerFn({ method: 'POST' })
  .inputValidator((data: { messageId: string; userId: string; emoji: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Check if reaction already exists
      const existing = await db.query.messageReactions.findFirst({
        where: and(
          eq(messageReactions.messageId, data.messageId),
          eq(messageReactions.userId, data.userId),
          eq(messageReactions.emoji, data.emoji)
        ),
      })

      if (existing) {
        // Remove reaction (toggle)
        await db.delete(messageReactions)
          .where(eq(messageReactions.id, existing.id))
        return { success: true, action: 'removed' }
      }

      await db.insert(messageReactions).values({
        id: uuidv4(),
        messageId: data.messageId,
        userId: data.userId,
        emoji: data.emoji,
        createdAt: new Date(),
      })

      return { success: true, action: 'added' }
    } catch (error) {
      console.error('Add reaction error:', error)
      return { success: false, error: 'Failed to add reaction' }
    }
  })

/**
 * Send floating bot message
 */
export const sendFloatingBotMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; role: 'user' | 'assistant'; content: string }) => data)
  .handler(async ({ data }) => {
    try {
      const messageId = uuidv4()

      await db.insert(floatingBotMessages).values({
        id: messageId,
        userId: data.userId,
        role: data.role,
        content: data.content,
        createdAt: new Date(),
      })

      return { success: true, messageId }
    } catch (error) {
      console.error('Send floating bot message error:', error)
      return { success: false, error: 'Failed to send message' }
    }
  })

/**
 * Get floating bot messages
 */
export const getFloatingBotMessages = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; limit?: number }) => data)
  .handler(async ({ data }) => {
    try {
      const messages = await db.query.floatingBotMessages.findMany({
        where: eq(floatingBotMessages.userId, data.userId),
        orderBy: desc(floatingBotMessages.createdAt),
        limit: data.limit || 50,
      })

      // Reverse for chronological order
      return {
        success: true,
        messages: messages.reverse().map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get floating bot messages error:', error)
      return { success: false, error: 'Failed to get messages' }
    }
  })

/**
 * Get team AI personas
 */
export const getTeamPersonas = createServerFn({ method: 'GET' })
  .inputValidator((data: { teamId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, data.teamId),
        with: {
          aiPersonas: {
            with: {
              persona: true,
            },
          },
        },
      })

      if (!team) {
        return { success: false, error: 'Team not found' }
      }

      return {
        success: true,
        personas: team.aiPersonas.map(ap => ({
          id: ap.persona.id,
          name: ap.persona.name,
          type: ap.persona.type,
          description: ap.persona.description,
          avatar: ap.persona.avatar,
          traits: ap.persona.traits ? JSON.parse(ap.persona.traits) : [],
          expertise: ap.persona.expertise ? JSON.parse(ap.persona.expertise) : [],
        })),
      }
    } catch (error) {
      console.error('Get team personas error:', error)
      return { success: false, error: 'Failed to get personas' }
    }
  })

/**
 * Get all available AI personas
 */
export const getAllPersonas = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const personas = await db.query.aiPersonas.findMany({
        where: eq(aiPersonas.isActive, true),
      })

      return {
        success: true,
        personas: personas.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          description: p.description,
          avatar: p.avatar,
          traits: p.traits ? JSON.parse(p.traits) : [],
          expertise: p.expertise ? JSON.parse(p.expertise) : [],
        })),
      }
    } catch (error) {
      console.error('Get all personas error:', error)
      return { success: false, error: 'Failed to get personas' }
    }
  })
