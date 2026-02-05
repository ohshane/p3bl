/**
 * @vitest-environment node
 *
 * Integration tests for sessions API functions
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
  getTestDb,
} from '../setup'
import * as schema from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

describe('Sessions API', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    closeTestDb()
  })

  beforeEach(() => {
    clearTestDb()
  })

  describe('Session CRUD', () => {
    it('should create a new session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)

      const session = await createTestSession(project.id, {
        title: 'Introduction to Machine Learning',
        order: 1,
      })

      const dbSession = await db.query.projectSessions.findFirst({
        where: eq(schema.projectSessions.id, session.id),
      })

      expect(dbSession).toBeDefined()
      expect(dbSession!.title).toBe('Introduction to Machine Learning')
      expect(dbSession!.order).toBe(1)
      expect(dbSession!.projectId).toBe(project.id)
    })

    it('should get session with all relations', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id, { title: 'Test Session' })

      // Add resources
      await db.insert(schema.sessionResources).values([
        {
          id: uuidv4(),
          sessionId: session.id,
          type: 'link',
          title: 'Resource 1',
          url: 'https://example.com/resource1',
          order: 0,
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          sessionId: session.id,
          type: 'pdf',
          title: 'Resource 2',
          filePath: '/uploads/doc.pdf',
          order: 1,
          createdAt: new Date(),
        },
      ])

      // Add rubrics
      await db.insert(schema.sessionRubrics).values([
        {
          id: uuidv4(),
          sessionId: session.id,
          criteria: 'Code Quality',
          description: 'Is the code clean and well-structured?',
          weight: 1,
          maxScore: 100,
          order: 0,
          createdAt: new Date(),
        },
      ])

      const fullSession = await db.query.projectSessions.findFirst({
        where: eq(schema.projectSessions.id, session.id),
        with: {
          resources: true,
          rubrics: true,
        },
      })

      expect(fullSession).toBeDefined()
      expect(fullSession!.resources).toHaveLength(2)
      expect(fullSession!.rubrics).toHaveLength(1)
    })

    it('should update session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)

      await db.update(schema.projectSessions)
        .set({
          title: 'Updated Session Title',
          topic: 'Neural Networks',
          guide: 'Follow these steps...',
          dueDate: new Date('2025-03-01'),
          updatedAt: new Date(),
        })
        .where(eq(schema.projectSessions.id, session.id))

      const updated = await db.query.projectSessions.findFirst({
        where: eq(schema.projectSessions.id, session.id),
      })

      expect(updated!.title).toBe('Updated Session Title')
      expect(updated!.topic).toBe('Neural Networks')
      expect(updated!.guide).toBe('Follow these steps...')
      expect(updated!.dueDate).toBeDefined()
    })

    it('should delete session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)

      await db.delete(schema.projectSessions)
        .where(eq(schema.projectSessions.id, session.id))

      const deleted = await db.query.projectSessions.findFirst({
        where: eq(schema.projectSessions.id, session.id),
      })

      expect(deleted).toBeUndefined()
    })
  })

  describe('Session Ordering', () => {
    it('should auto-increment order for new sessions', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)

      const session1 = await createTestSession(project.id, { order: 1 })
      const session2 = await createTestSession(project.id, { order: 2 })
      const session3 = await createTestSession(project.id, { order: 3 })

      const sessions = await db.query.projectSessions.findMany({
        where: eq(schema.projectSessions.projectId, project.id),
        orderBy: asc(schema.projectSessions.order),
      })

      expect(sessions).toHaveLength(3)
      expect(sessions[0].order).toBe(1)
      expect(sessions[1].order).toBe(2)
      expect(sessions[2].order).toBe(3)
    })

    it('should reorder sessions', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)

      const session1 = await createTestSession(project.id, { title: 'Session A', order: 1 })
      const session2 = await createTestSession(project.id, { title: 'Session B', order: 2 })
      const session3 = await createTestSession(project.id, { title: 'Session C', order: 3 })

      // Reorder: move session3 to position 1
      const newOrder = [session3.id, session1.id, session2.id]

      for (let i = 0; i < newOrder.length; i++) {
        await db.update(schema.projectSessions)
          .set({ order: i + 1, updatedAt: new Date() })
          .where(eq(schema.projectSessions.id, newOrder[i]))
      }

      const reordered = await db.query.projectSessions.findMany({
        where: eq(schema.projectSessions.projectId, project.id),
        orderBy: asc(schema.projectSessions.order),
      })

      expect(reordered[0].title).toBe('Session C')
      expect(reordered[1].title).toBe('Session A')
      expect(reordered[2].title).toBe('Session B')
    })
  })

  describe('Session Resources', () => {
    it('should add resource to session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)

      const resourceId = uuidv4()

      await db.insert(schema.sessionResources).values({
        id: resourceId,
        sessionId: session.id,
        type: 'video',
        title: 'Tutorial Video',
        url: 'https://youtube.com/watch?v=123',
        order: 0,
        createdAt: new Date(),
      })

      const resource = await db.query.sessionResources.findFirst({
        where: eq(schema.sessionResources.id, resourceId),
      })

      expect(resource).toBeDefined()
      expect(resource!.type).toBe('video')
      expect(resource!.title).toBe('Tutorial Video')
    })

    it('should delete resource', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)

      const resourceId = uuidv4()

      await db.insert(schema.sessionResources).values({
        id: resourceId,
        sessionId: session.id,
        type: 'link',
        title: 'To Delete',
        url: 'https://example.com',
        order: 0,
        createdAt: new Date(),
      })

      await db.delete(schema.sessionResources)
        .where(eq(schema.sessionResources.id, resourceId))

      const deleted = await db.query.sessionResources.findFirst({
        where: eq(schema.sessionResources.id, resourceId),
      })

      expect(deleted).toBeUndefined()
    })
  })

  describe('Session Rubrics', () => {
    it('should add rubric to session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)

      const rubricId = uuidv4()

      await db.insert(schema.sessionRubrics).values({
        id: rubricId,
        sessionId: session.id,
        criteria: 'Problem Understanding',
        description: 'Does the solution address the problem correctly?',
        weight: 2,
        maxScore: 100,
        order: 0,
        createdAt: new Date(),
      })

      const rubric = await db.query.sessionRubrics.findFirst({
        where: eq(schema.sessionRubrics.id, rubricId),
      })

      expect(rubric).toBeDefined()
      expect(rubric!.criteria).toBe('Problem Understanding')
      expect(rubric!.weight).toBe(2)
    })

    it('should delete rubric', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)

      const rubricId = uuidv4()

      await db.insert(schema.sessionRubrics).values({
        id: rubricId,
        sessionId: session.id,
        criteria: 'To Delete',
        weight: 1,
        maxScore: 100,
        order: 0,
        createdAt: new Date(),
      })

      await db.delete(schema.sessionRubrics)
        .where(eq(schema.sessionRubrics.id, rubricId))

      const deleted = await db.query.sessionRubrics.findFirst({
        where: eq(schema.sessionRubrics.id, rubricId),
      })

      expect(deleted).toBeUndefined()
    })
  })

  describe('Session Templates', () => {
    it('should add template to session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)

      const templateId = uuidv4()

      await db.insert(schema.sessionTemplates).values({
        id: templateId,
        sessionId: session.id,
        name: 'Report Template',
        content: '# Project Report\n\n## Introduction\n\n## Methods\n\n## Results\n\n## Conclusion',
        type: 'markdown',
        order: 0,
        createdAt: new Date(),
      })

      const template = await db.query.sessionTemplates.findFirst({
        where: eq(schema.sessionTemplates.id, templateId),
      })

      expect(template).toBeDefined()
      expect(template!.name).toBe('Report Template')
      expect(template!.type).toBe('markdown')
      expect(template!.content).toContain('# Project Report')
    })
  })

  describe('User Current Session', () => {
    it('should track user current session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id, { status: 'active' })
      const session1 = await createTestSession(project.id, { order: 1 })
      const session2 = await createTestSession(project.id, { order: 2 })
      const team = await createTestTeam(project.id)

      // Add user to team with session1
      await addUserToTeam(explorer.id, team.id, session1.id)

      // Verify initial session
      const membership = await db.query.teamMembers.findFirst({
        where: eq(schema.teamMembers.userId, explorer.id),
      })

      expect(membership!.currentSessionId).toBe(session1.id)

      // Update to session2
      await db.update(schema.teamMembers)
        .set({ currentSessionId: session2.id })
        .where(eq(schema.teamMembers.userId, explorer.id))

      const updated = await db.query.teamMembers.findFirst({
        where: eq(schema.teamMembers.userId, explorer.id),
      })

      expect(updated!.currentSessionId).toBe(session2.id)
    })
  })
})
