import { createServerFn } from '@tanstack/react-start'
import { eq, and, asc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import {
  projectSessions,
  sessionResources,
  sessionRubrics,
  sessionTemplates,
  teamMembers,
} from '@/db/schema'
import { z } from 'zod'

// Validation schemas
const createSessionSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  topic: z.string().optional(),
  guide: z.string().optional(),
  weight: z.number().min(1).max(200).default(1),
  deliverableType: z.enum(['none', 'document']).default('document'),
  deliverableTitle: z.string().optional(),
  deliverableDescription: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  llmModel: z.string().optional(),
})

const addResourceSchema = z.object({
  sessionId: z.string(),
  type: z.enum(['pdf', 'link', 'video', 'document', 'image']),
  title: z.string().min(1).max(200),
  url: z.string().url().optional(),
  filePath: z.string().optional(),
})

const addRubricSchema = z.object({
  sessionId: z.string(),
  criteria: z.string().min(1).max(500),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).default(1),
  maxScore: z.number().int().min(1).max(100).default(100),
})

/**
 * Get session by ID
 */
export const getSession = createServerFn({ method: 'GET' })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await db.query.projectSessions.findFirst({
        where: eq(projectSessions.id, data.sessionId),
        with: {
          resources: {
            orderBy: (r, { asc }) => [asc(r.order)],
          },
          rubrics: {
            orderBy: (r, { asc }) => [asc(r.order)],
          },
          templates: {
            orderBy: (t, { asc }) => [asc(t.order)],
          },
        },
      })

      if (!session) {
        return { success: false, error: 'Session not found' }
      }

      return {
        success: true,
        session: {
          ...session,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
          startDate: session.startDate?.toISOString(),
          endDate: session.endDate?.toISOString(),
        },
      }
    } catch (error) {
      console.error('Get session error:', error)
      return { success: false, error: 'Failed to get session' }
    }
  })

/**
 * Get all sessions for a project
 */
export const getProjectSessions = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const sessions = await db.query.projectSessions.findMany({
        where: eq(projectSessions.projectId, data.projectId),
        orderBy: asc(projectSessions.order),
        with: {
          resources: true,
          rubrics: true,
        },
      })

      return {
        success: true,
        sessions: sessions.map(s => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          startDate: s.startDate?.toISOString(),
          endDate: s.endDate?.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get project sessions error:', error)
      return { success: false, error: 'Failed to get sessions' }
    }
  })

/**
 * Create a new session
 */
export const createSession = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createSessionSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Get current max order
      const existingSessions = await db.query.projectSessions.findMany({
        where: eq(projectSessions.projectId, data.projectId),
      })

      const maxOrder = existingSessions.reduce((max, s) => Math.max(max, s.order), 0)

      const sessionId = uuidv4()
      const now = new Date()

      await db.insert(projectSessions).values({
        id: sessionId,
        projectId: data.projectId,
        order: maxOrder + 1,
        title: data.title,
        topic: data.topic,
        guide: data.guide,
        weight: data.weight,
        deliverableType: data.deliverableType,
        deliverableTitle: data.deliverableTitle,
        deliverableDescription: data.deliverableDescription,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        llmModel: data.llmModel,
        createdAt: now,
        updatedAt: now,
      })

      return { success: true, sessionId }
    } catch (error) {
      console.error('Create session error:', error)
      return { success: false, error: 'Failed to create session' }
    }
  })

/**
 * Update session
 */
export const updateSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; updates: Partial<z.infer<typeof createSessionSchema>> }) => data)
  .handler(async ({ data }) => {
    try {
      const updates: any = { ...data.updates, updatedAt: new Date() }
      
      if (data.updates.startDate) {
        updates.startDate = new Date(data.updates.startDate)
      }
      
      if (data.updates.endDate) {
        updates.endDate = new Date(data.updates.endDate)
      }

      await db.update(projectSessions)
        .set(updates)
        .where(eq(projectSessions.id, data.sessionId))

      return { success: true }
    } catch (error) {
      console.error('Update session error:', error)
      return { success: false, error: 'Failed to update session' }
    }
  })

/**
 * Delete session
 */
export const deleteSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Get session to know project and order
      const session = await db.query.projectSessions.findFirst({
        where: eq(projectSessions.id, data.sessionId),
      })

      if (!session) {
        return { success: false, error: 'Session not found' }
      }

      // Delete session (cascades to resources, rubrics, etc.)
      await db.delete(projectSessions)
        .where(eq(projectSessions.id, data.sessionId))

      // Reorder remaining sessions
      const remainingSessions = await db.query.projectSessions.findMany({
        where: eq(projectSessions.projectId, session.projectId),
        orderBy: asc(projectSessions.order),
      })

      for (let i = 0; i < remainingSessions.length; i++) {
        await db.update(projectSessions)
          .set({ order: i + 1 })
          .where(eq(projectSessions.id, remainingSessions[i].id))
      }

      return { success: true }
    } catch (error) {
      console.error('Delete session error:', error)
      return { success: false, error: 'Failed to delete session' }
    }
  })

/**
 * Reorder sessions
 */
export const reorderSessions = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionIds: string[] }) => data)
  .handler(async ({ data }) => {
    try {
      for (let i = 0; i < data.sessionIds.length; i++) {
        await db.update(projectSessions)
          .set({ order: i + 1, updatedAt: new Date() })
          .where(eq(projectSessions.id, data.sessionIds[i]))
      }

      return { success: true }
    } catch (error) {
      console.error('Reorder sessions error:', error)
      return { success: false, error: 'Failed to reorder sessions' }
    }
  })

/**
 * Add resource to session
 */
export const addResource = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => addResourceSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const existingResources = await db.query.sessionResources.findMany({
        where: eq(sessionResources.sessionId, data.sessionId),
      })

      const resourceId = uuidv4()

      await db.insert(sessionResources).values({
        id: resourceId,
        sessionId: data.sessionId,
        type: data.type,
        title: data.title,
        url: data.url,
        filePath: data.filePath,
        order: existingResources.length,
        createdAt: new Date(),
      })

      return { success: true, resourceId }
    } catch (error) {
      console.error('Add resource error:', error)
      return { success: false, error: 'Failed to add resource' }
    }
  })

/**
 * Delete resource
 */
export const deleteResource = createServerFn({ method: 'POST' })
  .inputValidator((data: { resourceId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await db.delete(sessionResources)
        .where(eq(sessionResources.id, data.resourceId))

      return { success: true }
    } catch (error) {
      console.error('Delete resource error:', error)
      return { success: false, error: 'Failed to delete resource' }
    }
  })

/**
 * Add rubric to session
 */
export const addRubric = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => addRubricSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const existingRubrics = await db.query.sessionRubrics.findMany({
        where: eq(sessionRubrics.sessionId, data.sessionId),
      })

      const rubricId = uuidv4()

      await db.insert(sessionRubrics).values({
        id: rubricId,
        sessionId: data.sessionId,
        criteria: data.criteria,
        description: data.description,
        weight: data.weight,
        maxScore: data.maxScore,
        order: existingRubrics.length,
        createdAt: new Date(),
      })

      return { success: true, rubricId }
    } catch (error) {
      console.error('Add rubric error:', error)
      return { success: false, error: 'Failed to add rubric' }
    }
  })

/**
 * Delete rubric
 */
export const deleteRubric = createServerFn({ method: 'POST' })
  .inputValidator((data: { rubricId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await db.delete(sessionRubrics)
        .where(eq(sessionRubrics.id, data.rubricId))

      return { success: true }
    } catch (error) {
      console.error('Delete rubric error:', error)
      return { success: false, error: 'Failed to delete rubric' }
    }
  })

/**
 * Update user's current session
 */
export const updateUserCurrentSession = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; teamId: string; sessionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await db.update(teamMembers)
        .set({ currentSessionId: data.sessionId })
        .where(and(
          eq(teamMembers.userId, data.userId),
          eq(teamMembers.teamId, data.teamId)
        ))

      return { success: true }
    } catch (error) {
      console.error('Update current session error:', error)
      return { success: false, error: 'Failed to update current session' }
    }
  })

/**
 * Add template to session
 */
export const addTemplate = createServerFn({ method: 'POST' })
  .inputValidator((data: { sessionId: string; name: string; content: string; type: 'document' | 'code' | 'markdown' }) => data)
  .handler(async ({ data }) => {
    try {
      const existingTemplates = await db.query.sessionTemplates.findMany({
        where: eq(sessionTemplates.sessionId, data.sessionId),
      })

      const templateId = uuidv4()

      await db.insert(sessionTemplates).values({
        id: templateId,
        sessionId: data.sessionId,
        name: data.name,
        content: data.content,
        type: data.type,
        order: existingTemplates.length,
        createdAt: new Date(),
      })

      return { success: true, templateId }
    } catch (error) {
      console.error('Add template error:', error)
      return { success: false, error: 'Failed to add template' }
    }
  })
