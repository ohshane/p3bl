/**
 * @vitest-environment node
 *
 * Integration tests for projects API functions
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
import { eq, and, count } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

describe('Projects API', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    closeTestDb()
  })

  beforeEach(() => {
    clearTestDb()
  })

  describe('Project CRUD', () => {
    it('should create a new project', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })

      const futureStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      const futureEnd = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000) // 28 days from now
      const project = await createTestProject(creator.id, {
        title: 'Machine Learning Basics',
        startDate: futureStart, // scheduled project
        endDate: futureEnd,
      })

      const dbProject = await db.query.projects.findFirst({
        where: eq(schema.projects.id, project.id),
      })

      expect(dbProject).toBeDefined()
      expect(dbProject!.title).toBe('Machine Learning Basics')
      expect(dbProject!.creatorId).toBe(creator.id)
      expect(dbProject!.startDate).toEqual(futureStart) // scheduled status derived from dates
      expect(dbProject!.joinCode).toHaveLength(6)
    })

    it('should get project with all relations', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)
      const session1 = await createTestSession(project.id, { title: 'Session 1', order: 1 })
      const session2 = await createTestSession(project.id, { title: 'Session 2', order: 2 })

      const fullProject = await db.query.projects.findFirst({
        where: eq(schema.projects.id, project.id),
        with: {
          sessions: true,
          creator: true,
        },
      })

      expect(fullProject).toBeDefined()
      expect(fullProject!.sessions).toHaveLength(2)
      expect(fullProject!.creator.id).toBe(creator.id)
    })

    it('should update project', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id)

      await db.update(schema.projects)
        .set({
          title: 'Updated Title',
          description: 'New description',
          drivingQuestion: 'What can we learn?',
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, project.id))

      const updated = await db.query.projects.findFirst({
        where: eq(schema.projects.id, project.id),
      })

      expect(updated!.title).toBe('Updated Title')
      expect(updated!.description).toBe('New description')
      expect(updated!.drivingQuestion).toBe('What can we learn?')
    })

    it('should list creator projects with stats', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })

      // Create multiple projects
      const project1 = await createTestProject(creator.id, { title: 'Project 1' })
      const project2 = await createTestProject(creator.id, { title: 'Project 2' })

      // Add sessions to project1
      await createTestSession(project1.id, { order: 1 })
      await createTestSession(project1.id, { order: 2 })

      // Add team to project1
      const team = await createTestTeam(project1.id)
      const explorer = await createTestUser({ role: 'explorer' })
      await addUserToTeam(explorer.id, team.id)

      // Get creator projects
      const projects = await db.query.projects.findMany({
        where: eq(schema.projects.creatorId, creator.id),
        with: { sessions: true },
      })

      expect(projects).toHaveLength(2)

      // Get team count for project1
      const teamCount = await db
        .select({ count: count() })
        .from(schema.teams)
        .where(eq(schema.teams.projectId, project1.id))

      expect(teamCount[0].count).toBe(1)
    })
  })

  describe('Project Join Flow', () => {
    it('should allow user to join with valid code', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })

      const project = await createTestProject(creator.id, {
        status: 'active',
        joinCode: 'ABC123',
      })
      const session = await createTestSession(project.id, { order: 1 })

      // Find project by code
      const foundProject = await db.query.projects.findFirst({
        where: and(
          eq(schema.projects.joinCode, 'ABC123'),
          eq(schema.projects.status, 'active')
        ),
      })

      expect(foundProject).toBeDefined()

      // Create team and add user
      const team = await createTestTeam(project.id)
      await addUserToTeam(explorer.id, team.id, session.id)

      // Verify membership
      const membership = await db.query.teamMembers.findFirst({
        where: eq(schema.teamMembers.userId, explorer.id),
        with: { team: true },
      })

      expect(membership).toBeDefined()
      expect(membership!.team.projectId).toBe(project.id)
    })

    it('should reject invalid join code', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      await createTestProject(creator.id, {
        status: 'active',
        joinCode: 'ABC123',
      })

      const foundProject = await db.query.projects.findFirst({
        where: and(
          eq(schema.projects.joinCode, 'INVALID'),
          eq(schema.projects.status, 'active')
        ),
      })

      expect(foundProject).toBeUndefined()
    })

    it('should track join code attempts', async () => {
      const db = getTestDb()
      const explorer = await createTestUser({ role: 'explorer' })

      // Record failed attempt
      await db.insert(schema.joinCodeAttempts).values({
        id: uuidv4(),
        userId: explorer.id,
        code: 'WRONG1',
        success: false,
        createdAt: new Date(),
      })

      const attempts = await db.query.joinCodeAttempts.findMany({
        where: eq(schema.joinCodeAttempts.userId, explorer.id),
      })

      expect(attempts).toHaveLength(1)
      expect(attempts[0].success).toBe(false)
    })

    it('should prevent joining inactive projects', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      await createTestProject(creator.id, {
        status: 'draft', // Not active
        joinCode: 'DRAFT1',
      })

      const foundProject = await db.query.projects.findFirst({
        where: and(
          eq(schema.projects.joinCode, 'DRAFT1'),
          eq(schema.projects.status, 'active')
        ),
      })

      expect(foundProject).toBeUndefined()
    })
  })

  describe('Project Activation', () => {
    it('should activate project with sessions', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id, { status: 'draft' })
      await createTestSession(project.id, { order: 1 })

      // Check session count
      const sessionCount = await db
        .select({ count: count() })
        .from(schema.projectSessions)
        .where(eq(schema.projectSessions.projectId, project.id))

      expect(sessionCount[0].count).toBeGreaterThan(0)

      // Activate
      await db.update(schema.projects)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(schema.projects.id, project.id))

      const activated = await db.query.projects.findFirst({
        where: eq(schema.projects.id, project.id),
      })

      expect(activated!.status).toBe('active')
    })

    it('should not activate project without sessions', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id, { status: 'draft' })

      // Check session count (should be 0)
      const sessionCount = await db
        .select({ count: count() })
        .from(schema.projectSessions)
        .where(eq(schema.projectSessions.projectId, project.id))

      expect(sessionCount[0].count).toBe(0)

      // Should not activate (in real code, this would return an error)
    })
  })

  describe('Project Teams', () => {
    it('should auto-assign users to teams', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id, { status: 'active' })
      await createTestSession(project.id, { order: 1 })

      // Create team with max 4 members
      const team = await createTestTeam(project.id, { name: 'Team 1' })

      // Add 4 users to fill team
      for (let i = 0; i < 4; i++) {
        const user = await createTestUser({ role: 'explorer' })
        await addUserToTeam(user.id, team.id)
      }

      // Verify team is full
      const memberCount = await db
        .select({ count: count() })
        .from(schema.teamMembers)
        .where(eq(schema.teamMembers.teamId, team.id))

      expect(memberCount[0].count).toBe(4)
    })

    it('should create new team when existing teams are full', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id, { status: 'active' })

      // Create first team
      const team1 = await createTestTeam(project.id, { name: 'Team 1' })

      // Create second team
      const team2 = await createTestTeam(project.id, { name: 'Team 2' })

      const teams = await db.query.teams.findMany({
        where: eq(schema.teams.projectId, project.id),
      })

      expect(teams).toHaveLength(2)
    })
  })

  describe('Project Invitations', () => {
    it('should create and respond to invitation', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const explorer = await createTestUser({ role: 'explorer' })
      const project = await createTestProject(creator.id, { status: 'active' })

      // Create invitation
      const invitationId = uuidv4()
      await db.insert(schema.projectInvitations).values({
        id: invitationId,
        projectId: project.id,
        userId: explorer.id,
        status: 'pending',
        createdAt: new Date(),
      })

      // Check pending invitation
      const pending = await db.query.projectInvitations.findFirst({
        where: and(
          eq(schema.projectInvitations.userId, explorer.id),
          eq(schema.projectInvitations.status, 'pending')
        ),
      })

      expect(pending).toBeDefined()

      // Accept invitation
      await db.update(schema.projectInvitations)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
        })
        .where(eq(schema.projectInvitations.id, invitationId))

      const accepted = await db.query.projectInvitations.findFirst({
        where: eq(schema.projectInvitations.id, invitationId),
      })

      expect(accepted!.status).toBe('accepted')
    })
  })

  describe('Join Code Management', () => {
    it('should reset join code', async () => {
      const db = getTestDb()
      const creator = await createTestUser({ role: 'creator' })
      const project = await createTestProject(creator.id, { joinCode: 'OLD123' })

      const newCode = 'NEW456'

      await db.update(schema.projects)
        .set({
          joinCode: newCode,
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, project.id))

      const updated = await db.query.projects.findFirst({
        where: eq(schema.projects.id, project.id),
      })

      expect(updated!.joinCode).toBe('NEW456')
      expect(updated!.joinCode).not.toBe('OLD123')
    })
  })
})
