import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import {
  artifacts,
  artifactVersions,
  precheckResults,
  precheckFeedbackItems,
  showcaseLinks,
  notifications,
  users,
} from '@/db/schema'
import { z } from 'zod'

// Validation schemas
const createArtifactSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  teamId: z.string(),
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  contentType: z.enum(['document']).default('document'),
})

const updateArtifactSchema = z.object({
  artifactId: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
})

const submitArtifactSchema = z.object({
  artifactId: z.string(),
  userId: z.string(),
})

const createShowcaseLinkSchema = z.object({
  artifactId: z.string(),
  versionId: z.string().optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
})

/**
 * Get artifact by ID
 */
export const getArtifact = createServerFn({ method: 'GET' })
  .inputValidator((data: { artifactId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const artifact = await db.query.artifacts.findFirst({
        where: eq(artifacts.id, data.artifactId),
        with: {
          user: true,
          versions: {
            orderBy: desc(artifactVersions.submittedAt),
          },
          precheckResults: {
            orderBy: desc(precheckResults.createdAt),
            limit: 1,
            with: {
              feedbackItems: true,
            },
          },
        },
      })

      if (!artifact) {
        return { success: false, error: 'Artifact not found' }
      }

      return {
        success: true,
        artifact: {
          ...artifact,
          createdAt: artifact.createdAt.toISOString(),
          updatedAt: artifact.updatedAt.toISOString(),
          lastPrecheckAt: artifact.lastPrecheckAt?.toISOString(),
          versions: artifact.versions.map(v => ({
            ...v,
            submittedAt: v.submittedAt.toISOString(),
          })),
          latestPrecheck: artifact.precheckResults[0] || null,
          author: {
            id: artifact.user.id,
            name: artifact.user.name,
            avatarUrl: artifact.user.avatarUrl,
          },
        },
      }
    } catch (error) {
      console.error('Get artifact error:', error)
      return { success: false, error: 'Failed to get artifact' }
    }
  })

/**
 * Get user's artifacts for a session
 */
export const getUserSessionArtifacts = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string; sessionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const userArtifacts = await db.query.artifacts.findMany({
        where: and(
          eq(artifacts.userId, data.userId),
          eq(artifacts.sessionId, data.sessionId)
        ),
        orderBy: desc(artifacts.updatedAt),
        with: {
          versions: {
            orderBy: desc(artifactVersions.submittedAt),
          },
        },
      })

      return {
        success: true,
        artifacts: userArtifacts.map(a => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
          lastPrecheckAt: a.lastPrecheckAt?.toISOString(),
          versionCount: a.versions.length,
          latestVersion: a.versions[0]?.version || null,
        })),
      }
    } catch (error) {
      console.error('Get user session artifacts error:', error)
      return { success: false, error: 'Failed to get artifacts' }
    }
  })

/**
 * Get the latest artifact for a team in a session (shared doc)
 */
export const getTeamSessionArtifact = createServerFn({ method: 'GET' })
  .inputValidator((data: { teamId: string; sessionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const teamArtifacts = await db.query.artifacts.findMany({
        where: and(
          eq(artifacts.teamId, data.teamId),
          eq(artifacts.sessionId, data.sessionId)
        ),
        orderBy: desc(artifacts.updatedAt),
        limit: 1,
        with: {
          versions: {
            orderBy: desc(artifactVersions.submittedAt),
          },
        },
      })

      const artifact = teamArtifacts[0]
      if (!artifact) {
        return { success: true, artifact: null }
      }

      return {
        success: true,
        artifact: {
          ...artifact,
          createdAt: artifact.createdAt.toISOString(),
          updatedAt: artifact.updatedAt.toISOString(),
          lastPrecheckAt: artifact.lastPrecheckAt?.toISOString(),
          versionCount: artifact.versions.length,
          latestVersion: artifact.versions[0]?.version || null,
        },
      }
    } catch (error) {
      console.error('Get team session artifact error:', error)
      return { success: false, error: 'Failed to get team artifact' }
    }
  })

/**
 * Get all user's artifacts (for portfolio)
 */
export const getUserArtifacts = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const userArtifacts = await db.query.artifacts.findMany({
        where: eq(artifacts.userId, data.userId),
        orderBy: desc(artifacts.updatedAt),
        with: {
          versions: {
            orderBy: desc(artifactVersions.submittedAt),
            limit: 1,
          },
          session: {
            with: {
              project: true,
            },
          },
        },
      })

      return {
        success: true,
        artifacts: userArtifacts.map(a => ({
          id: a.id,
          title: a.title,
          contentType: a.contentType,
          status: a.status,
          projectId: a.session.project.id,
          projectTitle: a.session.project.title,
          sessionId: a.session.id,
          sessionTitle: a.session.title,
          latestVersion: a.versions[0]?.version || null,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get user artifacts error:', error)
      return { success: false, error: 'Failed to get artifacts' }
    }
  })

/**
 * Create artifact
 */
export const createArtifact = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createArtifactSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const artifactId = uuidv4()
      const now = new Date()

      await db.insert(artifacts).values({
        id: artifactId,
        userId: data.userId,
        sessionId: data.sessionId,
        teamId: data.teamId,
        title: data.title,
        content: data.content,
        contentType: data.contentType,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      })

      return { success: true, artifactId }
    } catch (error) {
      console.error('Create artifact error:', error)
      return { success: false, error: 'Failed to create artifact' }
    }
  })

/**
 * Update artifact (auto-save draft)
 */
export const updateArtifact = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateArtifactSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { artifactId, ...updates } = data

      await db.update(artifacts)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(artifacts.id, artifactId))

      return { success: true }
    } catch (error) {
      console.error('Update artifact error:', error)
      return { success: false, error: 'Failed to update artifact' }
    }
  })

/**
 * Submit artifact (create version)
 */
export const submitArtifact = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => submitArtifactSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      // Get current artifact
      const artifact = await db.query.artifacts.findFirst({
        where: eq(artifacts.id, data.artifactId),
        with: {
          versions: {
            orderBy: desc(artifactVersions.submittedAt),
          },
        },
      })

      if (!artifact) {
        return { success: false, error: 'Artifact not found' }
      }

      if (!artifact.content) {
        return { success: false, error: 'Cannot submit empty artifact' }
      }

      // Determine version number
      let versionNumber: string
      if (artifact.versions.length === 0) {
        versionNumber = 'v1.0'
      } else {
        const lastVersion = artifact.versions[0].version
        const [major, minor] = lastVersion.replace('v', '').split('.').map(Number)
        versionNumber = `v${major}.${minor + 1}`
      }

      // Create version
      const versionId = uuidv4()
      const now = new Date()

      await db.insert(artifactVersions).values({
        id: versionId,
        artifactId: data.artifactId,
        version: versionNumber,
        content: artifact.content,
        submittedAt: now,
        submittedBy: data.userId,
      })

      // Update artifact status
      await db.update(artifacts)
        .set({
          status: 'submitted',
          currentVersion: versionNumber,
          updatedAt: now,
        })
        .where(eq(artifacts.id, data.artifactId))

      return {
        success: true,
        versionId,
        version: versionNumber,
      }
    } catch (error) {
      console.error('Submit artifact error:', error)
      return { success: false, error: 'Failed to submit artifact' }
    }
  })

/**
 * Store pre-check results
 */
export const storePrecheckResults = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    artifactId: string
    overallScore: 'ready' | 'needs_work' | 'critical_issues'
    feedback: Array<{
      severity: 'critical' | 'warning' | 'suggestion'
      message: string
      suggestion?: string
      lineNumber?: number
    }>
    rubricScores?: Record<string, number>
  }) => data)
  .handler(async ({ data }) => {
    try {
      const precheckId = uuidv4()
      const now = new Date()

      // Store pre-check result
      await db.insert(precheckResults).values({
        id: precheckId,
        artifactId: data.artifactId,
        overallScore: data.overallScore,
        feedback: JSON.stringify(data.feedback),
        rubricScores: data.rubricScores ? JSON.stringify(data.rubricScores) : null,
        createdAt: now,
      })

      // Store individual feedback items
      if (data.feedback.length > 0) {
        await db.insert(precheckFeedbackItems).values(
          data.feedback.map(f => ({
            id: uuidv4(),
            precheckId,
            severity: f.severity,
            message: f.message,
            suggestion: f.suggestion,
            lineNumber: f.lineNumber,
            createdAt: now,
          }))
        )
      }

      // Update artifact
      await db.update(artifacts)
        .set({
          lastPrecheckAt: now,
          precheckPassed: data.overallScore !== 'critical_issues',
          status: 'precheck_complete',
          updatedAt: now,
        })
        .where(eq(artifacts.id, data.artifactId))

      return { success: true, precheckId }
    } catch (error) {
      console.error('Store precheck results error:', error)
      return { success: false, error: 'Failed to store precheck results' }
    }
  })

/**
 * Create showcase link
 */
export const createShowcaseLink = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createShowcaseLinkSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const linkId = uuidv4()
      const token = uuidv4().replace(/-/g, '') // Remove dashes for cleaner URL
      const now = new Date()

      const expiresAt = data.expiresInDays
        ? new Date(now.getTime() + data.expiresInDays * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // Default 30 days

      await db.insert(showcaseLinks).values({
        id: linkId,
        artifactId: data.artifactId,
        versionId: data.versionId,
        token,
        expiresAt,
        isActive: true,
        viewCount: 0,
        createdAt: now,
      })

      return {
        success: true,
        linkId,
        token,
        url: `/showcase/${token}`,
        expiresAt: expiresAt.toISOString(),
      }
    } catch (error) {
      console.error('Create showcase link error:', error)
      return { success: false, error: 'Failed to create showcase link' }
    }
  })

/**
 * Get showcase link by token
 */
export const getShowcaseByToken = createServerFn({ method: 'GET' })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }) => {
    try {
      const link = await db.query.showcaseLinks.findFirst({
        where: eq(showcaseLinks.token, data.token),
        with: {
          artifact: {
            with: {
              user: true,
              session: {
                with: {
                  project: true,
                },
              },
            },
          },
          version: true,
        },
      })

      if (!link) {
        return { success: false, error: 'Showcase not found' }
      }

      if (!link.isActive) {
        return { success: false, error: 'This showcase link has been deactivated' }
      }

      if (link.expiresAt && link.expiresAt < new Date()) {
        return { success: false, error: 'This showcase link has expired' }
      }

      // Increment view count
      await db.update(showcaseLinks)
        .set({ viewCount: link.viewCount + 1 })
        .where(eq(showcaseLinks.id, link.id))

      return {
        success: true,
        showcase: {
          title: link.artifact.title,
          content: link.version?.content || link.artifact.content,
          contentType: link.artifact.contentType,
          version: link.version?.version,
          author: {
            name: link.artifact.user.name,
            avatarUrl: link.artifact.user.avatarUrl,
          },
          project: link.artifact.session.project.title,
          session: link.artifact.session.title,
          viewCount: link.viewCount + 1,
        },
      }
    } catch (error) {
      console.error('Get showcase error:', error)
      return { success: false, error: 'Failed to get showcase' }
    }
  })

/**
 * Revoke showcase link
 */
export const revokeShowcaseLink = createServerFn({ method: 'POST' })
  .inputValidator((data: { linkId: string }) => data)
  .handler(async ({ data }) => {
    try {
      await db.update(showcaseLinks)
        .set({ isActive: false })
        .where(eq(showcaseLinks.id, data.linkId))

      return { success: true }
    } catch (error) {
      console.error('Revoke showcase link error:', error)
      return { success: false, error: 'Failed to revoke showcase link' }
    }
  })

/**
 * Get artifact version history
 */
export const getArtifactVersions = createServerFn({ method: 'GET' })
  .inputValidator((data: { artifactId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const versions = await db.query.artifactVersions.findMany({
        where: eq(artifactVersions.artifactId, data.artifactId),
        orderBy: desc(artifactVersions.submittedAt),
        with: {
          submitter: true,
        },
      })

      return {
        success: true,
        versions: versions.map(v => ({
          id: v.id,
          version: v.version,
          submittedAt: v.submittedAt.toISOString(),
          submittedBy: {
            id: v.submitter.id,
            name: v.submitter.name,
          },
        })),
      }
    } catch (error) {
      console.error('Get artifact versions error:', error)
      return { success: false, error: 'Failed to get versions' }
    }
  })

/**
 * Get specific version content
 */
export const getArtifactVersion = createServerFn({ method: 'GET' })
  .inputValidator((data: { versionId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const version = await db.query.artifactVersions.findFirst({
        where: eq(artifactVersions.id, data.versionId),
      })

      if (!version) {
        return { success: false, error: 'Version not found' }
      }

      return {
        success: true,
        version: {
          ...version,
          submittedAt: version.submittedAt.toISOString(),
        },
      }
    } catch (error) {
      console.error('Get artifact version error:', error)
      return { success: false, error: 'Failed to get version' }
    }
  })
