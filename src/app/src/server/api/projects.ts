import { createServerFn } from '@tanstack/react-start'
import { eq, and, or, desc, gt, count, like, ne } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import {
  projects,
  projectSessions,
  sessionResources,
  sessionRubrics,
  teams,
  teamMembers,
  teamAiPersonas,
  projectInvitations,
  joinCodeAttempts,
  notifications,
  users,
} from '@/db/schema'
import { parseRoles } from '@/db/schema/users'
import { z } from 'zod'

// Validation schemas
const createProjectSchema = z.object({
  creatorId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  background: z.string().optional(),
  drivingQuestion: z.string().optional(),
  orgId: z.string().optional(),
  teamSize: z.number().int().min(1).max(10).default(4),
  maxParticipants: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

const joinProjectSchema = z.object({
  userId: z.string(),
  code: z.string().length(6),
  ipAddress: z.string().optional(),
})

// Generate a 6-character join code
function generateJoinCodeString(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid confusing chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// Generate a unique join code (checks for collisions)
async function generateUniqueJoinCode(maxAttempts = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateJoinCodeString()
    const existing = await db.query.projects.findFirst({
      where: eq(projects.joinCode, code),
      columns: { id: true },
    })
    if (!existing) {
      return code
    }
  }
  throw new Error('Failed to generate unique join code after maximum attempts')
}

/**
 * Get all projects for a creator
 */
export const getCreatorProjects = createServerFn({ method: 'GET' })
  .inputValidator((data: { creatorId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const projectList = await db.query.projects.findMany({
        where: eq(projects.creatorId, data.creatorId),
        orderBy: desc(projects.updatedAt),
        with: {
          sessions: {
            orderBy: (sessions, { asc }) => [asc(sessions.order)],
            with: {
              rubrics: true,
            },
          },
        },
      })

      // Get team counts for each project
      const projectsWithStats = await Promise.all(
        projectList.map(async (project) => {
          const teamCount = await db
            .select({ count: count() })
            .from(teams)
            .where(eq(teams.projectId, project.id))

          const memberCount = await db
            .select({ count: count() })
            .from(teamMembers)
            .innerJoin(teams, eq(teamMembers.teamId, teams.id))
            .where(eq(teams.projectId, project.id))

          return {
            ...project,
            teamCount: teamCount[0]?.count || 0,
            memberCount: memberCount[0]?.count || 0,
            sessionCount: project.sessions.length,
            sessions: project.sessions.map(s => ({
              ...s,
              startDate: s.startDate?.toISOString(),
              endDate: s.endDate?.toISOString(),
            })),
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            startDate: project.startDate?.toISOString(),
            endDate: project.endDate?.toISOString(),
          }
        })
      )

      return { success: true, projects: projectsWithStats }
    } catch (error) {
      console.error('Get creator projects error:', error)
      return { success: false, error: 'Failed to get projects' }
    }
  })

/**
 * Get all projects a user is a member of
 */
export const getUserProjects = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Find all teams the user is a member of
      const userTeams = await db.query.teamMembers.findMany({
        where: eq(teamMembers.userId, data.userId),
        with: {
          team: {
            with: {
              project: {
                with: {
                  sessions: true,
                  creator: true,
                },
              },
            },
          },
        },
      })

      const projectList = userTeams.map(tm => {
        const project = tm.team.project
        const currentSessionIndex = project.sessions.findIndex(s => s.id === tm.currentSessionId)
        
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          teamId: tm.team.id,
          teamName: tm.team.name,
          teamSize: project.teamSize,
          currentSessionId: tm.currentSessionId,
          currentSessionIndex: currentSessionIndex !== -1 ? currentSessionIndex : 0,
          sessionCount: project.sessions.length,
          sessions: project.sessions.map(s => ({
            id: s.id,
            title: s.title,
            startDate: s.startDate?.toISOString(),
            endDate: s.endDate?.toISOString(),
          })),
          creatorName: project.creator.name,
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          joinedAt: tm.joinedAt.toISOString(),
        }
      })

      // Fetch "waiting" projects (accepted invitations)
      const userInvitations = await db.query.projectInvitations.findMany({
        where: and(
          eq(projectInvitations.userId, data.userId),
          eq(projectInvitations.status, 'accepted')
        ),
        with: {
          project: {
            with: {
              sessions: true,
              creator: true,
            },
          },
        },
      })

      const existingProjectIds = new Set(projectList.map(p => p.id))
      
      const waitingProjects = userInvitations
        .filter(inv => !existingProjectIds.has(inv.project.id))
        .map(inv => {
          const project = inv.project
          return {
            id: project.id,
            title: project.title,
            description: project.description,
            teamId: '',
            teamName: 'Waiting for Allocation',
            teamSize: project.teamSize,
            currentSessionId: null,
            currentSessionIndex: 0,
            sessionCount: project.sessions.length,
            sessions: project.sessions.map(s => ({
              id: s.id,
              title: s.title,
              startDate: s.startDate?.toISOString(),
              endDate: s.endDate?.toISOString(),
            })),
            creatorName: project.creator.name,
            startDate: project.startDate?.toISOString(),
            endDate: project.endDate?.toISOString(),
            joinedAt: inv.respondedAt?.toISOString() || inv.createdAt.toISOString(),
            isWaiting: true
          }
        })

      return { success: true, projects: [...projectList, ...waitingProjects] }
    } catch (error) {
      console.error('Get user projects error:', error)
      return { success: false, error: 'Failed to get projects' }
    }
  })

/**
 * Get project by ID with full details
 */
export const getProject = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string; userId?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.projectId),
        with: {
          sessions: {
            orderBy: (sessions, { asc }) => [asc(sessions.order)],
            with: {
              resources: true,
              rubrics: true,
              templates: true,
            },
          },
          creator: true,
        },
      })

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      // Get user's team for this project if userId is provided
      let userTeam = null
      let isWaiting = false

      if (data.userId) {
        // Find the user's team for this specific project by joining through teams
        const membershipRow = await db
          .select({ teamId: teams.id })
          .from(teamMembers)
          .innerJoin(teams, eq(teamMembers.teamId, teams.id))
          .where(and(
            eq(teamMembers.userId, data.userId),
            eq(teams.projectId, data.projectId),
          ))

        if (membershipRow.length > 0) {
          // Load full team data with members and AI personas
          const team = await db.query.teams.findFirst({
            where: eq(teams.id, membershipRow[0].teamId),
            with: {
              members: {
                with: { user: true },
              },
              aiPersonas: {
                with: { persona: true },
              },
            },
          })

          if (team) {
            userTeam = {
              id: team.id,
              name: team.name,
              members: team.members.map(m => ({
                id: m.user.id,
                name: m.user.name,
                avatarUrl: m.user.avatarUrl,
                currentSessionId: m.currentSessionId,
                joinedAt: m.joinedAt.toISOString(),
              })),
              aiPersonas: team.aiPersonas.map(ap => ({
                id: ap.persona.id,
                name: ap.persona.name,
                type: ap.persona.type,
                avatar: ap.persona.avatar,
              })),
            }
          }
        } else {
          // Check if user is in waiting pool (accepted invitation)
          const invitation = await db.query.projectInvitations.findFirst({
            where: and(
              eq(projectInvitations.projectId, data.projectId),
              eq(projectInvitations.userId, data.userId),
              eq(projectInvitations.status, 'accepted'),
              // Ensure teamId is null to confirm waiting status
              // But strictly speaking, if they accepted and aren't in teamMembers yet, they are waiting/processing
            )
          })
          if (invitation && !invitation.teamId) {
            isWaiting = true
          }
        }
      }

      return {
        success: true,
        project: {
          ...project,
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          sessions: project.sessions.map(s => ({
            ...s,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
            startDate: s.startDate?.toISOString(),
            endDate: s.endDate?.toISOString(),
          })),
          creator: {
            id: project.creator.id,
            name: project.creator.name,
            avatarUrl: project.creator.avatarUrl,
          },
        },
        userTeam,
        isWaiting,
      }
    } catch (error) {
      console.error('Get project error:', error)
      return { success: false, error: 'Failed to get project' }
    }
  })

/**
 * Create a new project
 */
export const createProject = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createProjectSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const projectId = uuidv4()
      const joinCode = await generateUniqueJoinCode()
      const now = new Date()

      await db.insert(projects).values({
        id: projectId,
        creatorId: data.creatorId,
        title: data.title,
        description: data.description,
        background: data.background,
        drivingQuestion: data.drivingQuestion,
        orgId: data.orgId,
        joinCode,
        teamSize: data.teamSize,
        maxParticipants: data.maxParticipants,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdAt: now,
        updatedAt: now,
      })

      return {
        success: true,
        project: {
          id: projectId,
          joinCode,
        },
      }
    } catch (error) {
      console.error('Create project error:', error)
      return { success: false, error: 'Failed to create project' }
    }
  })

/**
 * Update project
 */
export const updateProject = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string; updates: Partial<z.infer<typeof createProjectSchema>> }) => data)
  .handler(async ({ data }) => {
    try {
      // Convert date strings to Date objects for DB
      const updates: Record<string, unknown> = { ...data.updates }
      if (data.updates.startDate) {
        updates.startDate = new Date(data.updates.startDate)
      }
      if (data.updates.endDate) {
        updates.endDate = new Date(data.updates.endDate)
      }
      
      await db.update(projects)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, data.projectId))

      return { success: true }
    } catch (error) {
      console.error('Update project error:', error)
      return { success: false, error: 'Failed to update project' }
    }
  })

/**
 * Delete project
 */
export const deleteProject = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Delete the project (sessions, resources, rubrics, templates will cascade delete)
      await db.delete(projects)
        .where(eq(projects.id, data.projectId))

      return { success: true }
    } catch (error) {
      console.error('Delete project error:', error)
      return { success: false, error: 'Failed to delete project' }
    }
  })

/**
 * Join project with code
 */
export const joinProject = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => joinProjectSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const code = data.code.toUpperCase()

      // Check rate limiting (5 attempts in 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const cooldownEnd = new Date(Date.now() + 5 * 60 * 1000)
      
      // Build conditions for rate limiting - check by userId OR ipAddress
      const rateLimitConditions = [eq(joinCodeAttempts.userId, data.userId)]
      if (data.ipAddress) {
        rateLimitConditions.push(eq(joinCodeAttempts.ipAddress, data.ipAddress))
      }
      
      const recentAttempts = await db
        .select({ count: count() })
        .from(joinCodeAttempts)
        .where(and(
          or(...rateLimitConditions),
          gt(joinCodeAttempts.createdAt, fiveMinutesAgo),
          eq(joinCodeAttempts.success, false)
        ))

      if ((recentAttempts[0]?.count || 0) >= 5) {
        return {
          success: false,
          error: 'Too many attempts. Please try again in 5 minutes.',
          rateLimited: true,
          cooldownEnd: cooldownEnd.toISOString(),
        }
      }

      // Find project with code
      const project = await db.query.projects.findFirst({
        where: eq(projects.joinCode, code),
      })

      // Check if join code has expired and if project is joinable (scheduled or opened)
      const now = new Date()
      const isExpired = project?.joinCodeExpiresAt && project.joinCodeExpiresAt < now
      
      // Project is joinable if:
      // - scheduled: startDate > now (future start)
      // - opened: startDate <= now AND (endDate > now OR no endDate)
      // NOT joinable if: closed (endDate <= now)
      const isScheduled = project && project.startDate && project.startDate > now
      const isOpened = project && (
        (!project.startDate || project.startDate <= now) &&
        (!project.endDate || project.endDate > now)
      )
      const isClosed = project && project.endDate && project.endDate <= now
      
      const isJoinable = !!(project && !isExpired && (isScheduled || isOpened) && !isClosed)

      // Record attempt
      await db.insert(joinCodeAttempts).values({
        id: uuidv4(),
        userId: data.userId,
        ipAddress: data.ipAddress,
        code,
        success: isJoinable,
        createdAt: now,
      })

      if (!project) {
        return { success: false, error: 'Invalid code. Please check and try again.' }
      }

      if (isExpired) {
        return { success: false, error: 'This join code has expired. Please contact your instructor.' }
      }

      if (isClosed) {
        return { success: false, error: 'This project has ended.' }
      }

      // Check if user already in a team for this project
      const existingMembership = await db
        .select()
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .where(and(
          eq(teams.projectId, project.id),
          eq(teamMembers.userId, data.userId)
        ))

      if (existingMembership.length > 0) {
        return {
          success: true,
          projectId: project.id,
          teamId: existingMembership[0].teams.id,
          message: 'Already a member of this project',
        }
      }

      // Check if user has a pending or accepted invitation (waiting pool)
      const existingInvitation = await db.query.projectInvitations.findFirst({
        where: and(
          eq(projectInvitations.projectId, project.id),
          eq(projectInvitations.userId, data.userId),
          eq(projectInvitations.status, 'accepted')
        )
      })

      if (existingInvitation) {
        return {
          success: true,
          projectId: project.id,
          message: 'You have joined the project and are waiting for it to start.',
          waiting: true
        }
      }

      // If project is scheduled (future start), add to waiting pool (invitations)
      if (isScheduled) {
        await db.insert(projectInvitations).values({
          id: uuidv4(),
          projectId: project.id,
          userId: data.userId,
          status: 'accepted',
          createdAt: now,
          respondedAt: now,
        })

        return {
          success: true,
          projectId: project.id,
          projectTitle: project.title,
          waiting: true,
          startDate: project.startDate?.toISOString()
        }
      }

      // Find a team with space or create new one
      const existingTeams = await db.query.teams.findMany({
        where: eq(teams.projectId, project.id),
        with: {
          members: true,
        },
      })

      let targetTeam = existingTeams.find(t => t.members.length < (project.teamSize || 4))

      if (!targetTeam) {
        // Create new team
        const teamId = uuidv4()
        const teamNumber = existingTeams.length + 1
        await db.insert(teams).values({
          id: teamId,
          projectId: project.id,
          name: `Team ${teamNumber}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        targetTeam = {
          id: teamId,
          projectId: project.id,
          name: `Team ${teamNumber}`,
          members: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      // Add user to team
      const firstSession = await db.query.projectSessions.findFirst({
        where: eq(projectSessions.projectId, project.id),
        orderBy: (s, { asc }) => [asc(s.order)],
      })

      await db.insert(teamMembers).values({
        teamId: targetTeam.id,
        userId: data.userId,
        currentSessionId: firstSession?.id,
        joinedAt: new Date(),
      })

      // Create notification (non-critical, don't fail the join if this errors)
      try {
        await db.insert(notifications).values({
          id: uuidv4(),
          userId: data.userId,
          type: 'project_invitation',
          title: 'Welcome!',
          message: `You've joined ${project.title}!`,
          projectId: project.id,
          teamId: targetTeam.id,
          createdAt: new Date(),
        })
      } catch (notifError) {
        console.error('Failed to create join notification (non-critical):', notifError)
      }

      return {
        success: true,
        projectId: project.id,
        teamId: targetTeam.id,
        projectTitle: project.title,
      }
    } catch (error) {
      console.error('Join project error:', error)
      return { success: false, error: 'Failed to join project' }
    }
  })

/**
 * Reset join code
 */
export const resetJoinCode = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string; creatorId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify the caller is the project creator
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.projectId),
        columns: { creatorId: true },
      })

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      if (project.creatorId !== data.creatorId) {
        return { success: false, error: 'Not authorized to reset join code' }
      }

      const newCode = await generateUniqueJoinCode()

      await db.update(projects)
        .set({
          joinCode: newCode,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, data.projectId))

      return { success: true, joinCode: newCode }
    } catch (error) {
      console.error('Reset join code error:', error)
      return { success: false, error: 'Failed to reset join code' }
    }
  })

/**
 * Get pending invitations for a user
 */
export const getUserInvitations = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const invitations = await db.query.projectInvitations.findMany({
        where: and(
          eq(projectInvitations.userId, data.userId),
          eq(projectInvitations.status, 'pending')
        ),
        with: {
          project: true,
        },
      })

      return {
        success: true,
        invitations: invitations.map(inv => ({
          id: inv.id,
          projectId: inv.project.id,
          projectTitle: inv.project.title,
          status: inv.status,
          createdAt: inv.createdAt.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get invitations error:', error)
      return { success: false, error: 'Failed to get invitations' }
    }
  })

/**
 * Respond to invitation
 */
export const respondToInvitation = createServerFn({ method: 'POST' })
  .inputValidator((data: { invitationId: string; accept: boolean }) => data)
  .handler(async ({ data }) => {
    try {
      const invitation = await db.query.projectInvitations.findFirst({
        where: eq(projectInvitations.id, data.invitationId),
        with: {
          project: true,
        },
      })

      if (!invitation) {
        return { success: false, error: 'Invitation not found' }
      }

      if (!data.accept) {
        // Dismiss invitation
        await db.update(projectInvitations)
          .set({
            status: 'dismissed',
            respondedAt: new Date(),
          })
          .where(eq(projectInvitations.id, data.invitationId))

        return { success: true }
      }

      // Accept invitation - join the project
      // Check if project is joinable (scheduled or opened, not closed)
      const now = new Date()
      const project = invitation.project
      
      const isScheduled = project.startDate && project.startDate > now
      const isOpened = (!project.startDate || project.startDate <= now) &&
                       (!project.endDate || project.endDate > now)
      const isClosed = project.endDate && project.endDate <= now
      
      if (isClosed) {
        return { success: false, error: 'This project has ended.' }
      }

      // If scheduled, just mark as accepted (waiting pool)
      if (isScheduled) {
        await db.update(projectInvitations)
          .set({
            status: 'accepted',
            respondedAt: new Date(),
          })
          .where(eq(projectInvitations.id, data.invitationId))

        return {
          success: true,
          projectId: invitation.projectId,
          waiting: true,
          startDate: project.startDate?.toISOString()
        }
      }
      
      // Find or create team
      let teamId = invitation.teamId

      if (!teamId) {
        // Find a team with space
        const existingTeams = await db.query.teams.findMany({
          where: eq(teams.projectId, invitation.projectId),
          with: { members: true },
        })

        const teamSize = invitation.project.teamSize || 4
        const availableTeam = existingTeams.find(t => t.members.length < teamSize)

        if (availableTeam) {
          teamId = availableTeam.id
        } else {
          // Create new team
          teamId = uuidv4()
          await db.insert(teams).values({
            id: teamId,
            projectId: invitation.projectId,
            name: `Team ${existingTeams.length + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      }

      // Add to team
      const firstSession = await db.query.projectSessions.findFirst({
        where: eq(projectSessions.projectId, invitation.projectId),
        orderBy: (s, { asc }) => [asc(s.order)],
      })

      await db.insert(teamMembers).values({
        teamId,
        userId: invitation.userId,
        currentSessionId: firstSession?.id,
        joinedAt: new Date(),
      })

      // Update invitation
      await db.update(projectInvitations)
        .set({
          status: 'accepted',
          teamId,
          respondedAt: new Date(),
        })
        .where(eq(projectInvitations.id, data.invitationId))

      return {
        success: true,
        projectId: invitation.projectId,
        teamId,
      }
    } catch (error) {
      console.error('Respond to invitation error:', error)
      return { success: false, error: 'Failed to respond to invitation' }
    }
  })

/**
 * Allocate teams for a project (start project)
 */
export const allocateTeams = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Fetch project settings
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.projectId),
      })

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      // Fetch all accepted invitations without teams (waiting pool)
      const participants = await db.query.projectInvitations.findMany({
        where: and(
          eq(projectInvitations.projectId, data.projectId),
          eq(projectInvitations.status, 'accepted')
        ),
      })

      // Filter those who truly don't have a team
      const waitingParticipants = participants.filter(p => !p.teamId)

      if (waitingParticipants.length === 0) {
        return { success: true, message: 'No participants to allocate' }
      }

      // Shuffle participants
      const shuffled = [...waitingParticipants]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const teamSize = project.teamSize || 4
      const existingTeams = await db.query.teams.findMany({
        where: eq(teams.projectId, data.projectId),
      })
      let teamCount = existingTeams.length
      
      // Calculate number of teams needed
      const numberOfTeams = Math.ceil(shuffled.length / teamSize)
      
      const firstSession = await db.query.projectSessions.findFirst({
        where: eq(projectSessions.projectId, data.projectId),
        orderBy: (s, { asc }) => [asc(s.order)],
      })

      const now = new Date()

      for (let i = 0; i < numberOfTeams; i++) {
        const teamId = uuidv4()
        teamCount++
        
        await db.insert(teams).values({
          id: teamId,
          projectId: data.projectId,
          name: `Team ${teamCount}`,
          createdAt: now,
          updatedAt: now,
        })

        // Get slice of users for this team
        const chunk = shuffled.slice(i * teamSize, (i + 1) * teamSize)
        
        for (const p of chunk) {
          await db.insert(teamMembers).values({
            teamId,
            userId: p.userId,
            currentSessionId: firstSession?.id,
            joinedAt: now,
          })

          // Update invitation
          await db.update(projectInvitations)
            .set({ teamId })
            .where(eq(projectInvitations.id, p.id))
            
          // Notification
          await db.insert(notifications).values({
            id: uuidv4(),
            userId: p.userId,
            type: 'team_assignment',
            title: 'Team Assigned',
            message: `You have been assigned to Team ${teamCount}!`,
            projectId: data.projectId,
            teamId,
            createdAt: now,
          })
        }
      }

      return { success: true, allocatedCount: waitingParticipants.length }
    } catch (error) {
      console.error('Allocate teams error:', error)
      return { success: false, error: 'Failed to allocate teams' }
    }
  })

/**
 * Get all project participants (both in teams and waiting)
 */
export const getProjectParticipants = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Get all accepted invitations for this project
      const invitations = await db.query.projectInvitations.findMany({
        where: and(
          eq(projectInvitations.projectId, data.projectId),
          eq(projectInvitations.status, 'accepted')
        ),
        with: {
          user: true,
          team: true,
        },
      })

      const participants = invitations.map(inv => ({
        id: inv.userId,
        name: inv.user.name,
        email: inv.user.email,
        avatar: inv.user.avatarUrl,
        teamId: inv.teamId,
        teamName: inv.team?.name || null,
        joinedAt: inv.respondedAt?.toISOString() || inv.createdAt.toISOString(),
      }))

      // Separate into waiting (no team) and assigned (has team)
      const waiting = participants.filter(p => !p.teamId)
      const assigned = participants.filter(p => p.teamId)

      return {
        success: true,
        participants: {
          total: participants.length,
          waiting,
          assigned,
        },
      }
    } catch (error) {
      console.error('Get project participants error:', error)
      return { success: false, error: 'Failed to get participants' }
    }
  })

/**
 * Remove a participant from a project (kick/추방)
 * Removes from team_members and deletes the project invitation.
 */
export const removeParticipant = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string; userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Find teams in this project that the user belongs to
      const projectTeams = await db.query.teams.findMany({
        where: eq(teams.projectId, data.projectId),
      })

      // Remove from team_members and clean up empty teams
      for (const team of projectTeams) {
        await db.delete(teamMembers)
          .where(and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.userId, data.userId),
          ))

        // Check if team is now empty, if so delete it
        const remaining = await db
          .select({ count: count() })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, team.id))

        if ((remaining[0]?.count || 0) === 0) {
          await db.delete(teams).where(eq(teams.id, team.id))
        }
      }

      // Remove the accepted invitation
      await db.delete(projectInvitations)
        .where(and(
          eq(projectInvitations.projectId, data.projectId),
          eq(projectInvitations.userId, data.userId),
        ))

      return { success: true }
    } catch (error) {
      console.error('Remove participant error:', error)
      return { success: false, error: 'Failed to remove participant' }
    }
  })

/**
 * Search users eligible for project delegation (admin or creator roles)
 */
export const searchDelegateUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: { search: string; excludeUserId?: string }) => data)
  .handler(async ({ data }) => {
    try {
      const searchPattern = `%${data.search}%`

      let query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(
          and(
            // User must have admin or creator role in their role array
            or(
              like(users.role, '%"admin"%'),
              like(users.role, '%"creator"%')
            ),
            or(
              like(users.name, searchPattern),
              like(users.email, searchPattern)
            ),
            ...(data.excludeUserId ? [ne(users.id, data.excludeUserId)] : [])
          )
        )
        .limit(10)

      const results = await query

      return {
        success: true as const,
        users: results.map(u => ({ ...u, role: parseRoles(u.role) })),
      }
    } catch (error) {
      console.error('Search delegate users error:', error)
      return { success: false as const, error: 'Failed to search users' }
    }
  })

/**
 * Delegate (transfer) project ownership to another user
 */
export const delegateProject = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string; currentCreatorId: string; newCreatorId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Verify the project exists and belongs to the current creator
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.projectId),
        columns: { id: true, creatorId: true, title: true },
      })

      if (!project) {
        return { success: false as const, error: 'Project not found' }
      }

      if (project.creatorId !== data.currentCreatorId) {
        return { success: false as const, error: 'Not authorized to delegate this project' }
      }

      // Verify the new creator exists and has an eligible role
      const newCreator = await db.query.users.findFirst({
        where: eq(users.id, data.newCreatorId),
        columns: { id: true, role: true, name: true },
      })

      if (!newCreator) {
        return { success: false as const, error: 'Target user not found' }
      }

      const newCreatorRoles = parseRoles(newCreator.role)
      if (!newCreatorRoles.includes('admin') && !newCreatorRoles.includes('creator')) {
        return { success: false as const, error: 'Target user does not have an eligible role (requires admin or creator)' }
      }

      // Transfer ownership
      await db.update(projects)
        .set({
          creatorId: data.newCreatorId,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, data.projectId))

      return {
        success: true as const,
        message: `Project "${project.title}" delegated to ${newCreator.name}`,
      }
    } catch (error) {
      console.error('Delegate project error:', error)
      return { success: false as const, error: 'Failed to delegate project' }
    }
  })
