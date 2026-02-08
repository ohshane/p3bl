/**
 * @vitest-environment node
 *
 * Integration tests for chat API functions
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import {
  setupTestDb,
  closeTestDb,
  clearTestDb,
  createTestUser,
  createTestProject,
  createTestSession,
  createTestTeam,
  addUserToTeam,
  createTestPersona,
  getTestDb,
} from '../setup'
import * as schema from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

/** Helper to create a chat room for a project */
async function createTestRoom(projectId: string, name = 'Test Room') {
  const db = getTestDb()
  const roomId = uuidv4()
  const now = new Date()
  await db.insert(schema.chatRooms).values({
    id: roomId,
    projectId,
    name,
    createdAt: now,
    updatedAt: now,
  })
  return { id: roomId, projectId, name }
}

describe('Chat API', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    closeTestDb()
  })

  beforeEach(() => {
    clearTestDb()
  })

  describe('Chat Messages', () => {
    it('should send a user message', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const _session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, _session.id)
      const room = await createTestRoom(project.id)

      const messageId = uuidv4()
      const now = new Date()

      await db.insert(schema.chatMessages).values({
        id: messageId,
        roomId: room.id,
        userId: explorer.id,
        content: 'Hello team!',
        type: 'text',
        isEdited: false,
        createdAt: now,
        updatedAt: now,
      })

      const message = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.id, messageId),
        with: { user: true },
      })

      expect(message).toBeDefined()
      expect(message!.content).toBe('Hello team!')
      expect(message!.user?.id).toBe(explorer.id)
    })

    it('should send an AI persona message', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const team = await createTestTeam(project.id)
      const persona = await createTestPersona({ name: 'Sage', type: 'tutor' })
      const room = await createTestRoom(project.id)

      // Link persona to team
      await db.insert(schema.teamAiPersonas).values({
        teamId: team.id,
        personaId: persona.id,
        assignedAt: new Date(),
      })

      const messageId = uuidv4()

      await db.insert(schema.chatMessages).values({
        id: messageId,
        roomId: room.id,
        personaId: persona.id,
        content: 'Welcome to the project! How can I help you today?',
        type: 'text',
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const message = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.id, messageId),
        with: { persona: true },
      })

      expect(message).toBeDefined()
      expect(message!.persona?.name).toBe('Sage')
      expect(message!.persona?.type).toBe('tutor')
    })

    it('should get messages for a room', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer1 = await createTestUser({ role: 'explorer' })
      const explorer2 = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer1.id, team.id, session.id)
      await addUserToTeam(explorer2.id, team.id, session.id)
      const room = await createTestRoom(project.id)

      const now = Date.now()

      // Create multiple messages
      await db.insert(schema.chatMessages).values([
        {
          id: uuidv4(),
          roomId: room.id,
          userId: explorer1.id,
          content: 'Message 1',
          type: 'text',
          isEdited: false,
          createdAt: new Date(now - 3000),
          updatedAt: new Date(now - 3000),
        },
        {
          id: uuidv4(),
          roomId: room.id,
          userId: explorer2.id,
          content: 'Message 2',
          type: 'text',
          isEdited: false,
          createdAt: new Date(now - 2000),
          updatedAt: new Date(now - 2000),
        },
        {
          id: uuidv4(),
          roomId: room.id,
          userId: explorer1.id,
          content: 'Message 3',
          type: 'text',
          isEdited: false,
          createdAt: new Date(now - 1000),
          updatedAt: new Date(now - 1000),
        },
      ])

      const messages = await db.query.chatMessages.findMany({
        where: eq(schema.chatMessages.roomId, room.id),
        orderBy: desc(schema.chatMessages.createdAt),
        limit: 50,
        with: { user: true },
      })

      expect(messages).toHaveLength(3)
      expect(messages[0].content).toBe('Message 3') // Most recent first
    })

    it('should support reply to message', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer1 = await createTestUser({ role: 'explorer' })
      const explorer2 = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer1.id, team.id, session.id)
      await addUserToTeam(explorer2.id, team.id, session.id)
      const room = await createTestRoom(project.id)

      // Original message
      const originalId = uuidv4()
      await db.insert(schema.chatMessages).values({
        id: originalId,
        roomId: room.id,
        userId: explorer1.id,
        content: 'What do you think about this approach?',
        type: 'text',
        isEdited: false,
        createdAt: new Date(Date.now() - 1000),
        updatedAt: new Date(Date.now() - 1000),
      })

      // Reply message
      const replyId = uuidv4()
      await db.insert(schema.chatMessages).values({
        id: replyId,
        roomId: room.id,
        userId: explorer2.id,
        content: 'I think it looks great!',
        type: 'text',
        replyToId: originalId,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const reply = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.id, replyId),
        with: {
          replyTo: {
            with: { user: true },
          },
        },
      })

      expect(reply).toBeDefined()
      expect(reply!.replyTo).toBeDefined()
      expect(reply!.replyTo!.content).toBe('What do you think about this approach?')
    })

    it('should edit message', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const _session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, _session.id)
      const room = await createTestRoom(project.id)

      const messageId = uuidv4()

      await db.insert(schema.chatMessages).values({
        id: messageId,
        roomId: room.id,
        userId: explorer.id,
        content: 'Original message',
        type: 'text',
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await db.update(schema.chatMessages)
        .set({
          content: 'Edited message',
          isEdited: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.chatMessages.id, messageId))

      const edited = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.id, messageId),
      })

      expect(edited!.content).toBe('Edited message')
      expect(edited!.isEdited).toBe(true)
    })

    it('should delete message', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const _session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, _session.id)
      const room = await createTestRoom(project.id)

      const messageId = uuidv4()

      await db.insert(schema.chatMessages).values({
        id: messageId,
        roomId: room.id,
        userId: explorer.id,
        content: 'To be deleted',
        type: 'text',
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await db.delete(schema.chatMessages)
        .where(eq(schema.chatMessages.id, messageId))

      const deleted = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.id, messageId),
      })

      expect(deleted).toBeUndefined()
    })
  })

  describe('Message Reactions', () => {
    it('should add reaction to message', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer1 = await createTestUser({ role: 'explorer' })
      const explorer2 = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer1.id, team.id, session.id)
      await addUserToTeam(explorer2.id, team.id, session.id)
      const room = await createTestRoom(project.id)

      const messageId = uuidv4()

      await db.insert(schema.chatMessages).values({
        id: messageId,
        roomId: room.id,
        userId: explorer1.id,
        content: 'Great job everyone!',
        type: 'text',
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await db.insert(schema.messageReactions).values({
        id: uuidv4(),
        messageId,
        userId: explorer2.id,
        emoji: '👍',
        createdAt: new Date(),
      })

      const message = await db.query.chatMessages.findFirst({
        where: eq(schema.chatMessages.id, messageId),
        with: { reactions: true },
      })

      expect(message!.reactions).toHaveLength(1)
      expect(message!.reactions[0].emoji).toBe('👍')
    })

    it('should toggle reaction (add/remove)', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)
      const room = await createTestRoom(project.id)

      const messageId = uuidv4()
      const reactionId = uuidv4()

      await db.insert(schema.chatMessages).values({
        id: messageId,
        roomId: room.id,
        userId: explorer.id,
        content: 'Test message',
        type: 'text',
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // Add reaction
      await db.insert(schema.messageReactions).values({
        id: reactionId,
        messageId,
        userId: explorer.id,
        emoji: '❤️',
        createdAt: new Date(),
      })

      // Check exists
      const existing = await db.query.messageReactions.findFirst({
        where: and(
          eq(schema.messageReactions.messageId, messageId),
          eq(schema.messageReactions.userId, explorer.id),
          eq(schema.messageReactions.emoji, '❤️')
        ),
      })

      expect(existing).toBeDefined()

      // Remove reaction (toggle)
      await db.delete(schema.messageReactions)
        .where(eq(schema.messageReactions.id, reactionId))

      const removed = await db.query.messageReactions.findFirst({
        where: eq(schema.messageReactions.id, reactionId),
      })

      expect(removed).toBeUndefined()
    })
  })

  describe('Floating Bot Messages', () => {
    it('should store floating bot conversation', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      // User message
      await db.insert(schema.floatingBotMessages).values({
        id: uuidv4(),
        userId: explorer.id,
        role: 'user',
        content: 'How do I submit my artifact?',
        createdAt: new Date(Date.now() - 1000),
      })

      // Assistant response
      await db.insert(schema.floatingBotMessages).values({
        id: uuidv4(),
        userId: explorer.id,
        role: 'assistant',
        content: 'To submit your artifact, click the "Submit" button in the editor.',
        createdAt: new Date(),
      })

      const messages = await db.query.floatingBotMessages.findMany({
        where: eq(schema.floatingBotMessages.userId, explorer.id),
        orderBy: desc(schema.floatingBotMessages.createdAt),
      })

      expect(messages).toHaveLength(2)
      expect(messages[0].role).toBe('assistant')
      expect(messages[1].role).toBe('user')
    })
  })

  describe('AI Personas', () => {
    it('should get team personas', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const team = await createTestTeam(project.id)

      const persona1 = await createTestPersona({ name: 'Sage', type: 'tutor' })
      const persona2 = await createTestPersona({ name: 'Spark', type: 'facilitator' })

      // Link personas to team
      await db.insert(schema.teamAiPersonas).values([
        { teamId: team.id, personaId: persona1.id, assignedAt: new Date() },
        { teamId: team.id, personaId: persona2.id, assignedAt: new Date() },
      ])

      const teamWithPersonas = await db.query.teams.findFirst({
        where: eq(schema.teams.id, team.id),
        with: {
          aiPersonas: {
            with: { persona: true },
          },
        },
      })

      expect(teamWithPersonas!.aiPersonas).toHaveLength(2)
      expect(teamWithPersonas!.aiPersonas.map(ap => ap.persona.name).sort()).toEqual(['Sage', 'Spark'])
    })

    it('should get all available personas', async () => {
      const db = getTestDb()

      await createTestPersona({ name: 'Sage', type: 'tutor' })
      await createTestPersona({ name: 'Spark', type: 'facilitator' })
      await createTestPersona({ name: 'Atlas', type: 'expert' })
      await createTestPersona({ name: 'Echo', type: 'critic' })

      const personas = await db.query.aiPersonas.findMany({
        where: eq(schema.aiPersonas.isActive, true),
      })

      expect(personas).toHaveLength(4)
    })
  })
})
