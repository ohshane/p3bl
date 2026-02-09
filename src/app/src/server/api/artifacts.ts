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

type GeneratedPrecheckItem = {
  id: string
  severity: 'critical' | 'warning' | 'suggestion'
  message: string
  suggestion?: string
  lineNumber?: number
}

type GeneratedPrecheckResult = {
  overallScore: 'ready' | 'needs_work' | 'critical_issues'
  rubricScores: Record<string, number>
  items: GeneratedPrecheckItem[]
}

const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY
const OPENROUTER_API_BASE = process.env.VITE_API_BASE || 'https://openrouter.ai/api/v1'
const OPENROUTER_API_URL = `${OPENROUTER_API_BASE}/chat/completions`
const DEFAULT_PRECHECK_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'

function buildRubricContext(rubrics: Array<{ criteria: string; description: string | null; weight: number }>) {
  if (rubrics.length === 0) return ''
  return rubrics
    .map((r) => `- ${r.criteria} (${r.weight}%): ${r.description || 'No description provided'}`)
    .join('\n')
}

function generateFallbackPrecheck(
  content: string,
  rubrics: Array<{ id: string; criteria: string; weight: number }>
): GeneratedPrecheckResult {
  const wordCount = content.split(/\s+/).filter(Boolean).length
  const baseScore = Math.max(30, Math.min(95, Math.round(Math.min(wordCount / 8, 100))))
  const rubricScores = Object.fromEntries(
    rubrics.map((rubric) => [rubric.criteria, baseScore])
  )

  const items: GeneratedPrecheckItem[] = []
  if (wordCount < 100) {
    items.push({
      id: 'submission_length_critical',
      severity: 'critical',
      message: 'Submission is too short for reliable rubric evaluation.',
      suggestion: 'Add more evidence, explanation, and examples.',
    })
  } else if (wordCount < 250) {
    items.push({
      id: 'submission_length_warning',
      severity: 'warning',
      message: 'Submission may need more depth against rubric criteria.',
      suggestion: 'Expand your argument and align it with each rubric criterion.',
    })
  }

  const overallScore: 'ready' | 'needs_work' | 'critical_issues' =
    wordCount < 100 ? 'critical_issues' : wordCount < 250 ? 'needs_work' : 'ready'

  return {
    overallScore,
    rubricScores,
    items,
  }
}

async function generateSubmissionPrecheck(
  content: string,
  rubrics: Array<{ id: string; criteria: string; description: string | null; weight: number }>
): Promise<GeneratedPrecheckResult> {
  if (!OPENROUTER_API_KEY) {
    return generateFallbackPrecheck(content, rubrics)
  }

  const rubricContext = buildRubricContext(rubrics)
  const systemPrompt = `You are an academic evaluator.
Score the submission against the rubric criteria below and return strict JSON only.

Rubric criteria:
${rubricContext || '- No rubric criteria provided'}

Output schema:
{
  "overallScore": "ready" | "needs_work" | "critical_issues",
  "rubricScores": { "<criterion name>": <0-100 number> },
  "items": [
    {
      "id": "unique_string",
      "severity": "critical" | "warning" | "suggestion",
      "message": "issue summary",
      "suggestion": "how to improve"
    }
  ]
}`

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_PRECHECK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Submission:\n\n${content}` },
        ],
        max_tokens: 900,
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter submit precheck failed: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.choices?.[0]?.message?.content || '{}'
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('OpenRouter submit precheck returned non-JSON content')
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<GeneratedPrecheckResult>
    const normalizedOverall: GeneratedPrecheckResult['overallScore'] =
      parsed.overallScore === 'critical_issues' || parsed.overallScore === 'needs_work' || parsed.overallScore === 'ready'
        ? parsed.overallScore
        : 'needs_work'

    const parsedScores = parsed.rubricScores && typeof parsed.rubricScores === 'object'
      ? parsed.rubricScores
      : {}

    const rubricScores = Object.fromEntries(
      rubrics.map((rubric) => {
        const raw = parsedScores[rubric.criteria]
        const score = typeof raw === 'number' ? Math.max(0, Math.min(100, Math.round(raw))) : 60
        return [rubric.criteria, score]
      })
    )

    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((item, idx) => {
            const severity = item?.severity === 'critical' || item?.severity === 'warning' || item?.severity === 'suggestion'
              ? item.severity
              : 'suggestion'
            if (!item?.message || typeof item.message !== 'string') return null
            return {
              id: typeof item.id === 'string' && item.id ? item.id : `submit_fb_${idx + 1}`,
              severity,
              message: item.message,
              suggestion: typeof item.suggestion === 'string' ? item.suggestion : undefined,
            } as GeneratedPrecheckItem
          })
          .filter((item): item is GeneratedPrecheckItem => item !== null)
      : []

    return {
      overallScore: normalizedOverall,
      rubricScores,
      items,
    }
  } catch (error) {
    console.error('Submit-time rubric precheck error:', error)
    return generateFallbackPrecheck(content, rubrics)
  }
}

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
          lastSubmittedAt: artifact.versions[0]?.submittedAt?.toISOString() || null,
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
          session: {
            with: {
              rubrics: {
                orderBy: (rubrics, { asc }) => [asc(rubrics.order)],
              },
            },
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

      // Re-run rubric scoring on submission so Assessment AI Score is always fresh.
      const generatedPrecheck = await generateSubmissionPrecheck(artifact.content, artifact.session.rubrics)
      const teamSessionArtifacts = await db.query.artifacts.findMany({
        where: and(
          eq(artifacts.teamId, artifact.teamId),
          eq(artifacts.sessionId, artifact.sessionId)
        ),
      })

      // Apply same score to all teammates' artifacts in this team/session.
      for (const targetArtifact of teamSessionArtifacts) {
        const precheckId = uuidv4()
        await db.insert(precheckResults).values({
          id: precheckId,
          artifactId: targetArtifact.id,
          overallScore: generatedPrecheck.overallScore,
          feedback: JSON.stringify(generatedPrecheck.items),
          rubricScores: JSON.stringify(generatedPrecheck.rubricScores),
          createdAt: now,
        })

        if (generatedPrecheck.items.length > 0) {
          await db.insert(precheckFeedbackItems).values(
            generatedPrecheck.items.map((item) => ({
              id: uuidv4(),
              precheckId,
              severity: item.severity,
              message: item.message,
              suggestion: item.suggestion,
              lineNumber: item.lineNumber,
              createdAt: now,
            }))
          )
        }
      }

      await db.update(artifacts)
        .set({
          status: 'submitted',
          lastPrecheckAt: now,
          precheckPassed: generatedPrecheck.overallScore !== 'critical_issues',
          updatedAt: now,
        })
        .where(and(
          eq(artifacts.teamId, artifact.teamId),
          eq(artifacts.sessionId, artifact.sessionId)
        ))

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
