/**
 * @vitest-environment node
 *
 * Integration tests for artifacts API functions
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
  createTestArtifact,
  getTestDb,
} from '../setup'
import * as schema from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

describe('Artifacts API', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    closeTestDb()
  })

  beforeEach(() => {
    clearTestDb()
  })

  describe('Artifact CRUD', () => {
    it('should create a new artifact', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id, {
        title: 'My Research Paper',
        content: 'Initial content...',
        status: 'draft',
      })

      const dbArtifact = await db.query.artifacts.findFirst({
        where: eq(schema.artifacts.id, artifact.id),
      })

      expect(dbArtifact).toBeDefined()
      expect(dbArtifact!.title).toBe('My Research Paper')
      expect(dbArtifact!.status).toBe('draft')
      expect(dbArtifact!.userId).toBe(explorer.id)
    })

    it('should get artifact with relations', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id, {
        content: 'Artifact content',
      })

      const fullArtifact = await db.query.artifacts.findFirst({
        where: eq(schema.artifacts.id, artifact.id),
        with: {
          user: true,
          session: {
            with: { project: true },
          },
        },
      })

      expect(fullArtifact).toBeDefined()
      expect(fullArtifact!.user.id).toBe(explorer.id)
      expect(fullArtifact!.session.project.id).toBe(project.id)
    })

    it('should update artifact (auto-save)', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id)

      await db.update(schema.artifacts)
        .set({
          title: 'Updated Title',
          content: 'Updated content with more details...',
          updatedAt: new Date(),
        })
        .where(eq(schema.artifacts.id, artifact.id))

      const updated = await db.query.artifacts.findFirst({
        where: eq(schema.artifacts.id, artifact.id),
      })

      expect(updated!.title).toBe('Updated Title')
      expect(updated!.content).toContain('Updated content')
    })
  })

  describe('Artifact Versioning', () => {
    it('should create version on submit', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id, {
        content: 'First version content',
      })

      // Create version
      const versionId = uuidv4()
      await db.insert(schema.artifactVersions).values({
        id: versionId,
        artifactId: artifact.id,
        version: 'v1.0',
        content: 'First version content',
        submittedAt: new Date(),
        submittedBy: explorer.id,
      })

      // Update artifact status
      await db.update(schema.artifacts)
        .set({
          status: 'submitted',
          currentVersion: 'v1.0',
          updatedAt: new Date(),
        })
        .where(eq(schema.artifacts.id, artifact.id))

      const submitted = await db.query.artifacts.findFirst({
        where: eq(schema.artifacts.id, artifact.id),
        with: { versions: true },
      })

      expect(submitted!.status).toBe('submitted')
      expect(submitted!.currentVersion).toBe('v1.0')
      expect(submitted!.versions).toHaveLength(1)
    })

    it('should increment version number on resubmit', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id)

      // First submission
      await db.insert(schema.artifactVersions).values({
        id: uuidv4(),
        artifactId: artifact.id,
        version: 'v1.0',
        content: 'Version 1',
        submittedAt: new Date(Date.now() - 10000),
        submittedBy: explorer.id,
      })

      // Second submission
      await db.insert(schema.artifactVersions).values({
        id: uuidv4(),
        artifactId: artifact.id,
        version: 'v1.1',
        content: 'Version 1.1 with improvements',
        submittedAt: new Date(),
        submittedBy: explorer.id,
      })

      const versions = await db.query.artifactVersions.findMany({
        where: eq(schema.artifactVersions.artifactId, artifact.id),
        orderBy: desc(schema.artifactVersions.submittedAt),
      })

      expect(versions).toHaveLength(2)
      expect(versions[0].version).toBe('v1.1')
      expect(versions[1].version).toBe('v1.0')
    })

    it('should retrieve specific version content', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id)

      const v1Id = uuidv4()
      const v2Id = uuidv4()

      await db.insert(schema.artifactVersions).values([
        {
          id: v1Id,
          artifactId: artifact.id,
          version: 'v1.0',
          content: 'Original content',
          submittedAt: new Date(Date.now() - 10000),
          submittedBy: explorer.id,
        },
        {
          id: v2Id,
          artifactId: artifact.id,
          version: 'v1.1',
          content: 'Improved content',
          submittedAt: new Date(),
          submittedBy: explorer.id,
        },
      ])

      const v1 = await db.query.artifactVersions.findFirst({
        where: eq(schema.artifactVersions.id, v1Id),
      })

      expect(v1!.content).toBe('Original content')
    })
  })

  describe('Pre-check Results', () => {
    it('should store pre-check results', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id)

      const precheckId = uuidv4()
      const feedback = [
        { severity: 'warning', message: 'Consider adding more examples' },
        { severity: 'suggestion', message: 'Format code blocks properly' },
      ]

      await db.insert(schema.precheckResults).values({
        id: precheckId,
        artifactId: artifact.id,
        overallScore: 'needs_work',
        feedback: JSON.stringify(feedback),
        createdAt: new Date(),
      })

      // Update artifact
      await db.update(schema.artifacts)
        .set({
          lastPrecheckAt: new Date(),
          precheckPassed: false,
          status: 'precheck_complete',
          updatedAt: new Date(),
        })
        .where(eq(schema.artifacts.id, artifact.id))

      const result = await db.query.precheckResults.findFirst({
        where: eq(schema.precheckResults.id, precheckId),
      })

      expect(result).toBeDefined()
      expect(result!.overallScore).toBe('needs_work')
      expect(JSON.parse(result!.feedback!)).toHaveLength(2)
    })

    it('should store feedback items separately', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id)

      const precheckId = uuidv4()

      await db.insert(schema.precheckResults).values({
        id: precheckId,
        artifactId: artifact.id,
        overallScore: 'ready',
        createdAt: new Date(),
      })

      await db.insert(schema.precheckFeedbackItems).values([
        {
          id: uuidv4(),
          precheckId,
          severity: 'suggestion',
          message: 'Consider improving variable naming',
          suggestion: 'Use descriptive names like "userCount" instead of "n"',
          lineNumber: 15,
          createdAt: new Date(),
        },
      ])

      const precheck = await db.query.precheckResults.findFirst({
        where: eq(schema.precheckResults.id, precheckId),
        with: { feedbackItems: true },
      })

      expect(precheck!.feedbackItems).toHaveLength(1)
      expect(precheck!.feedbackItems[0].lineNumber).toBe(15)
    })
  })

  describe('Showcase Links', () => {
    it('should create showcase link', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id, {
        status: 'submitted',
      })

      const linkId = uuidv4()
      const token = uuidv4().replace(/-/g, '')
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

      await db.insert(schema.showcaseLinks).values({
        id: linkId,
        artifactId: artifact.id,
        token,
        expiresAt,
        isActive: true,
        viewCount: 0,
        createdAt: new Date(),
      })

      const link = await db.query.showcaseLinks.findFirst({
        where: eq(schema.showcaseLinks.token, token),
      })

      expect(link).toBeDefined()
      expect(link!.isActive).toBe(true)
      expect(link!.viewCount).toBe(0)
    })

    it('should track view count', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id)

      const linkId = uuidv4()
      const token = 'testtoken123'

      await db.insert(schema.showcaseLinks).values({
        id: linkId,
        artifactId: artifact.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        viewCount: 0,
        createdAt: new Date(),
      })

      // Simulate 3 views
      for (let i = 0; i < 3; i++) {
        const link = await db.query.showcaseLinks.findFirst({
          where: eq(schema.showcaseLinks.token, token),
        })

        await db.update(schema.showcaseLinks)
          .set({ viewCount: link!.viewCount + 1 })
          .where(eq(schema.showcaseLinks.id, linkId))
      }

      const viewed = await db.query.showcaseLinks.findFirst({
        where: eq(schema.showcaseLinks.token, token),
      })

      expect(viewed!.viewCount).toBe(3)
    })

    it('should revoke showcase link', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session = await createTestSession(project.id)
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      const artifact = await createTestArtifact(explorer.id, session.id, team.id)

      const linkId = uuidv4()

      await db.insert(schema.showcaseLinks).values({
        id: linkId,
        artifactId: artifact.id,
        token: 'torevoke',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        viewCount: 0,
        createdAt: new Date(),
      })

      // Revoke
      await db.update(schema.showcaseLinks)
        .set({ isActive: false })
        .where(eq(schema.showcaseLinks.id, linkId))

      const revoked = await db.query.showcaseLinks.findFirst({
        where: eq(schema.showcaseLinks.id, linkId),
      })

      expect(revoked!.isActive).toBe(false)
    })
  })

  describe('User Artifacts', () => {
    it('should get all artifacts for user (portfolio)', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session1 = await createTestSession(project.id, { title: 'Session 1', order: 1 })
      const session2 = await createTestSession(project.id, { title: 'Session 2', order: 2 })
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session1.id)

      // Create artifacts in multiple sessions
      await createTestArtifact(explorer.id, session1.id, team.id, { title: 'Artifact 1' })
      await createTestArtifact(explorer.id, session2.id, team.id, { title: 'Artifact 2' })

      const artifacts = await db.query.artifacts.findMany({
        where: eq(schema.artifacts.userId, explorer.id),
        with: {
          session: {
            with: { project: true },
          },
        },
      })

      expect(artifacts).toHaveLength(2)
      expect(artifacts[0].session.project.id).toBe(project.id)
    })

    it('should get artifacts for specific session', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id)
      const session1 = await createTestSession(project.id, { order: 1 })
      const session2 = await createTestSession(project.id, { order: 2 })
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session1.id)

      await createTestArtifact(explorer.id, session1.id, team.id, { title: 'Session 1 Artifact' })
      await createTestArtifact(explorer.id, session2.id, team.id, { title: 'Session 2 Artifact' })

      const session1Artifacts = await db.query.artifacts.findMany({
        where: eq(schema.artifacts.sessionId, session1.id),
      })

      expect(session1Artifacts).toHaveLength(1)
      expect(session1Artifacts[0].title).toBe('Session 1 Artifact')
    })
  })
})
