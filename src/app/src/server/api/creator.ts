import { createServerFn } from '@tanstack/react-start'
import { eq, and, desc, gte, count, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/db'
import {
  projects,
  projectSessions,
  teams,
  teamMembers,
  artifacts,
  precheckResults,
  precheckFeedbackItems,
  aiPersonas,
  learningMetrics,
  dailyMetricsAggregate,
  aiInterventions,
  teamRiskAssessments,
  sessionRubrics,
  chatMessages,
  chatRooms,
  activityLogs,
} from '@/db/schema'
import { generateSubmissionPrecheck } from './artifacts'

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Get creator dashboard statistics
 */
export const getCreatorDashboardStats = createServerFn({ method: 'GET' })
  .inputValidator((data: { creatorId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Get all creator's projects (excluding templates)
      const creatorProjects = await db.query.projects.findMany({
        where: and(
          eq(projects.creatorId, data.creatorId),
          eq(projects.isTemplate, false)
        ),
      })

      const projectIds = creatorProjects.map(p => p.id)

      if (projectIds.length === 0) {
        return {
          success: true,
          stats: {
            scheduledProjects: 0,
            openedProjects: 0,
            closedProjects: 0,
            totalLearners: 0,
            projectsAtRisk: 0,
          },
        }
      }

      // Count projects by time-based status
      const now = new Date()
      const scheduledProjects = creatorProjects.filter(p => {
        if (!p.startDate) return false
        return p.startDate > now
      }).length
      const openedProjects = creatorProjects.filter(p => {
        const startOk = !p.startDate || p.startDate <= now
        const endOk = !p.endDate || p.endDate > now
        return startOk && endOk
      }).length
      const closedProjects = creatorProjects.filter(p => {
        if (!p.endDate) return false
        return p.endDate <= now
      }).length

      // Get total learner count across opened projects
      const openedProjectIds = creatorProjects.filter(p => {
        const startOk = !p.startDate || p.startDate <= now
        const endOk = !p.endDate || p.endDate > now
        return startOk && endOk
      }).map(p => p.id)
      
      let totalLearners = 0
      if (openedProjectIds.length > 0) {
        const memberCountResult = await db
          .select({ count: count() })
          .from(teamMembers)
          .innerJoin(teams, eq(teamMembers.teamId, teams.id))
          .where(inArray(teams.projectId, openedProjectIds))
        totalLearners = memberCountResult[0]?.count || 0
      }

      // Get projects at risk (from latest risk assessments)
      let projectsAtRisk = 0
      if (openedProjectIds.length > 0) {
        const riskAssessments = await db
          .select({
            projectId: teamRiskAssessments.projectId,
            riskLevel: teamRiskAssessments.riskLevel,
          })
          .from(teamRiskAssessments)
          .where(inArray(teamRiskAssessments.projectId, openedProjectIds))

        // Count unique projects with any red risk teams
        const projectsWithRedRisk = new Set(
          riskAssessments.filter(r => r.riskLevel === 'red').map(r => r.projectId)
        )
        projectsAtRisk = projectsWithRedRisk.size
      }

      return {
        success: true,
        stats: {
          scheduledProjects,
          openedProjects,
          closedProjects,
          totalLearners,
          projectsAtRisk,
        },
      }
    } catch (error) {
      console.error('Get creator dashboard stats error:', error)
      return { success: false, error: 'Failed to get dashboard stats' }
    }
  })

// ============================================================================
// PROJECT TEAMS WITH PROGRESS
// ============================================================================

/**
 * Get teams with session progress derived from artifacts
 */
export const getProjectTeamsWithProgress = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Get project with sessions
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.projectId),
        with: {
          sessions: {
            orderBy: (sessions, { asc }) => [asc(sessions.order)],
          },
        },
      })

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      // Get all teams with members
      const projectTeams = await db.query.teams.findMany({
        where: eq(teams.projectId, data.projectId),
        with: {
          members: {
            with: {
              user: true,
            },
          },
        },
      })

      // Get latest risk assessments for each team
      const riskAssessments = await db.query.teamRiskAssessments.findMany({
        where: eq(teamRiskAssessments.projectId, data.projectId),
        orderBy: desc(teamRiskAssessments.assessedAt),
      })

      // Create a map of latest risk per team
      const riskByTeam = new Map<string, typeof riskAssessments[0]>()
      for (const assessment of riskAssessments) {
        if (!riskByTeam.has(assessment.teamId)) {
          riskByTeam.set(assessment.teamId, assessment)
        }
      }

      // Get artifacts for each team/session to determine progress
      const teamArtifacts = await db.query.artifacts.findMany({
        where: inArray(
          artifacts.teamId,
          projectTeams.map(t => t.id)
        ),
      })

      // Build the matrix data
      const matrixData = projectTeams.map(team => {
        const teamRisk = riskByTeam.get(team.id)
        const teamArtifactsList = teamArtifacts.filter(a => a.teamId === team.id)

        // Calculate session progress from all teammate artifacts in each session.
        const sessionProgress = project.sessions.map(session => {
          const sessionArtifacts = teamArtifactsList.filter(a => a.sessionId === session.id)

          let status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'needs_revision' = 'not_started'
          // Team-level rule: if any teammate has submitted/under_review/approved, show submitted+ progress.
          if (sessionArtifacts.some(a => a.status === 'approved')) {
            status = 'approved'
          } else if (sessionArtifacts.some(a => a.status === 'needs_revision')) {
            status = 'needs_revision'
          } else if (sessionArtifacts.some(a => a.status === 'submitted' || a.status === 'under_review')) {
            status = 'submitted'
          } else if (sessionArtifacts.some(a =>
            a.status === 'draft' || a.status === 'precheck_pending' || a.status === 'precheck_complete'
          )) {
            status = 'in_progress'
          }

          const latestSubmittedArtifact = sessionArtifacts
            .filter(a => a.status === 'submitted' || a.status === 'under_review' || a.status === 'approved')
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]
          const latestStatusArtifact = sessionArtifacts
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]

          return {
            sessionId: session.id,
            sessionIndex: session.order,
            status,
            startDate: session.startDate?.toISOString() || null,
            submittedAt: latestSubmittedArtifact ? latestSubmittedArtifact.updatedAt.toISOString() : null,
            statusUpdatedAt: latestStatusArtifact ? latestStatusArtifact.updatedAt.toISOString() : null,
          }
        })

        // Find last activity across all team members
        const lastActivity = team.members.reduce((latest, member) => {
          // This is a simplified approach - in production you'd track activity separately
          return latest
        }, null as Date | null)

        return {
          teamId: team.id,
          teamName: team.name,
          riskLevel: (teamRisk?.riskLevel || 'green') as 'green' | 'yellow' | 'red',
          riskReason: teamRisk?.riskFactors ? JSON.parse(teamRisk.riskFactors)[0] : null,
          lastActivityAt: teamRisk?.lastActivityAt?.toISOString() || new Date().toISOString(),
          members: team.members.map(m => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            avatar: m.user.avatarUrl,
            status: 'active' as const,
            currentSessionId: m.currentSessionId,
            completedSessions: sessionProgress.filter(s => s.status === 'approved').length,
            currentSessionProgress: 0, // Would need more detailed tracking
            lastActiveAt: new Date().toISOString(), // Would need activity tracking
          })),
          sessionProgress,
        }
      })

      return {
        success: true,
        sessions: project.sessions.map(s => ({
          id: s.id,
          title: s.title,
          order: s.order,
        })),
        teams: matrixData,
      }
    } catch (error) {
      console.error('Get project teams with progress error:', error)
      return { success: false, error: 'Failed to get team progress' }
    }
  })

// ============================================================================
// LEARNING METRICS (DipChart)
// ============================================================================

/**
 * Get learning metrics for DipChart visualization
 */
export const getLearningMetrics = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string; days?: number }) => data)
  .handler(async ({ data }) => {
    try {
      const days = data.days || 30
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().split('T')[0]

      // Try to get aggregated daily metrics first
      const aggregatedMetrics = await db.query.dailyMetricsAggregate.findMany({
        where: and(
          eq(dailyMetricsAggregate.projectId, data.projectId),
          gte(dailyMetricsAggregate.date, startDateStr)
        ),
        orderBy: dailyMetricsAggregate.date,
      })

      if (aggregatedMetrics.length > 0) {
        return {
          success: true,
          metrics: aggregatedMetrics.map(m => ({
            date: m.date,
            confidence: m.avgConfidence || 0,
            engagement: m.avgEngagement || 0,
            aiSupportedCurve: m.avgAiSupported || 0,
            traditionalCurve: m.avgTraditional || 0,
          })),
        }
      }

      // If no aggregated metrics, try raw metrics
      const rawMetrics = await db.query.learningMetrics.findMany({
        where: and(
          eq(learningMetrics.projectId, data.projectId),
          gte(learningMetrics.recordedAt, startDate)
        ),
        orderBy: learningMetrics.recordedAt,
      })

      if (rawMetrics.length > 0) {
        // Aggregate by day
        const metricsByDay = new Map<string, {
          confidence: number[]
          engagement: number[]
          aiSupported: number[]
          traditional: number[]
        }>()

        for (const metric of rawMetrics) {
          const date = metric.recordedAt.toISOString().split('T')[0]
          if (!metricsByDay.has(date)) {
            metricsByDay.set(date, {
              confidence: [],
              engagement: [],
              aiSupported: [],
              traditional: [],
            })
          }
          const dayMetrics = metricsByDay.get(date)!
          switch (metric.metricType) {
            case 'confidence':
              dayMetrics.confidence.push(metric.value)
              break
            case 'engagement':
              dayMetrics.engagement.push(metric.value)
              break
            case 'ai_supported':
              dayMetrics.aiSupported.push(metric.value)
              break
            case 'traditional':
              dayMetrics.traditional.push(metric.value)
              break
          }
        }

        const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

        const chartData = Array.from(metricsByDay.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, metrics]) => ({
            date,
            confidence: Math.round(avg(metrics.confidence)),
            engagement: Math.round(avg(metrics.engagement)),
            aiSupportedCurve: Math.round(avg(metrics.aiSupported)),
            traditionalCurve: Math.round(avg(metrics.traditional)),
          }))

        return { success: true, metrics: chartData }
      }

      // No explicit metrics found - derive from actual project activity
      // This computes dip chart values from artifacts, chat, prechecks, and activity data
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.projectId),
        with: { sessions: true },
      })

      if (!project || !project.startDate) {
        return { success: true, metrics: [] }
      }

      // Get project teams
      const projectTeams = await db.query.teams.findMany({
        where: eq(teams.projectId, data.projectId),
      })

      if (projectTeams.length === 0) {
        return { success: true, metrics: [] }
      }

      const sessionIds = project.sessions.map(s => s.id)

      // ---- Gather all activity data in parallel ----

      // 1. Artifacts with prechecks (confidence signal)
      const projectArtifacts = sessionIds.length > 0
        ? await db.query.artifacts.findMany({
            where: inArray(artifacts.sessionId, sessionIds),
            with: { precheckResults: true },
          })
        : []

      // 2. Chat messages in project rooms (engagement signal)
      const projectRooms = await db.query.chatRooms.findMany({
        where: eq(chatRooms.projectId, data.projectId),
      })
      const roomIds = projectRooms.map(r => r.id)
      const projectMessages = roomIds.length > 0
        ? await db.query.chatMessages.findMany({
            where: inArray(chatMessages.roomId, roomIds),
            orderBy: chatMessages.createdAt,
          })
        : []

      // 3. Activity logs for project entities
      const projectActivityLogs = await db.select()
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.entityType, 'project'),
            eq(activityLogs.entityId, data.projectId),
          )
        )
        .orderBy(activityLogs.createdAt)

      // ---- Build daily buckets from project start to now ----

      const projectStart = new Date(project.startDate)
      const now = new Date()
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      const rangeStart = projectStart > cutoff ? projectStart : cutoff

      // Determine the session difficulty timeline for "expected dip" modeling
      const sortedSessions = [...project.sessions].sort((a, b) => a.order - b.order)
      const difficultyWeights: Record<string, number> = { easy: 0.2, medium: 0.5, hard: 0.8 }

      // Helper: get the session active on a given date based on session start/end dates
      function getSessionDifficultyForDate(date: Date): number {
        for (const session of sortedSessions) {
          if (session.startDate && session.endDate) {
            const sStart = new Date(session.startDate)
            const sEnd = new Date(session.endDate)
            if (date >= sStart && date <= sEnd) {
              return difficultyWeights[session.difficulty] || 0.5
            }
          }
        }
        // Estimate from session order / position in project timeline
        const projectDuration = now.getTime() - projectStart.getTime()
        const elapsed = date.getTime() - projectStart.getTime()
        const progress = projectDuration > 0 ? elapsed / projectDuration : 0
        const sessionIndex = Math.min(
          Math.floor(progress * sortedSessions.length),
          sortedSessions.length - 1
        )
        const session = sortedSessions[Math.max(0, sessionIndex)]
        return session ? (difficultyWeights[session.difficulty] || 0.5) : 0.5
      }

      // Helper: format date as YYYY-MM-DD
      function fmtDate(d: Date): string {
        return d.toISOString().split('T')[0]
      }

      // Helper: check if timestamp falls on a given date string
      function isOnDate(ts: Date | number | null | undefined, dateStr: string): boolean {
        if (!ts) return false
        const d = ts instanceof Date ? ts : new Date(ts)
        return fmtDate(d) === dateStr
      }

      // Generate date range
      const dateRange: string[] = []
      const cursor = new Date(rangeStart)
      cursor.setHours(0, 0, 0, 0)
      while (cursor <= now) {
        dateRange.push(fmtDate(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }

      if (dateRange.length === 0) {
        return { success: true, metrics: [] }
      }

      // ---- Compute daily metrics ----

      const totalTeams = projectTeams.length
      const derivedMetrics = dateRange.map((dateStr) => {
        const dateObj = new Date(dateStr)
        const difficulty = getSessionDifficultyForDate(dateObj)

        // --- Confidence: derived from artifact status & precheck results ---
        // Artifacts that existed by this date
        const artifactsOnDate = projectArtifacts.filter(a => isOnDate(a.createdAt, dateStr) || isOnDate(a.updatedAt, dateStr))
        const artifactsUpToDate = projectArtifacts.filter(a => {
          const created = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
          return fmtDate(created) <= dateStr
        })

        let confidence = 65 // baseline
        if (artifactsUpToDate.length > 0) {
          // Count statuses: approved artifacts boost confidence, needs_revision lowers it
          const approved = artifactsUpToDate.filter(a => a.status === 'approved').length
          const submitted = artifactsUpToDate.filter(a => a.status === 'submitted' || a.status === 'under_review').length
          const needsRevision = artifactsUpToDate.filter(a => a.status === 'needs_revision').length
          const total = artifactsUpToDate.length
          const approvalRate = total > 0 ? (approved + submitted * 0.5) / total : 0
          const revisionPenalty = total > 0 ? needsRevision / total : 0

          // Precheck quality: what % of prechecks on or before this day were 'ready'
          const prechecksUpToDate = artifactsUpToDate.flatMap(a => a.precheckResults || []).filter(p => {
            const created = p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt)
            return fmtDate(created) <= dateStr
          })
          const readyPrechecks = prechecksUpToDate.filter(p => p.overallScore === 'ready').length
          const precheckRate = prechecksUpToDate.length > 0 ? readyPrechecks / prechecksUpToDate.length : 0.5

          confidence = Math.round(
            40 + // floor
            approvalRate * 30 + // up to 30 from approvals
            precheckRate * 20 + // up to 20 from precheck quality
            (1 - revisionPenalty) * 10 // up to 10 from low revision rate
          )
        }
        // Apply difficulty dip: harder sessions depress confidence
        confidence = Math.round(confidence * (1 - difficulty * 0.3))

        // --- Engagement: derived from message volume + artifact activity ---
        const messagesOnDate = projectMessages.filter(m => isOnDate(m.createdAt, dateStr))
        const activityOnDate = projectActivityLogs.filter(a => isOnDate(a.createdAt, dateStr))

        // Normalize: messages per team, activity per team
        const msgPerTeam = totalTeams > 0 ? messagesOnDate.length / totalTeams : 0
        const actPerTeam = totalTeams > 0 ? activityOnDate.length / totalTeams : 0
        const artifactActivityCount = artifactsOnDate.length

        // Engagement score: combine message density + activity + artifact work
        // Scale: ~5 msgs/team/day + ~3 activities + ~1 artifact = ~100%
        let engagement = Math.round(
          Math.min(100, 
            (Math.min(msgPerTeam, 10) / 10) * 40 + // up to 40 from chat
            (Math.min(actPerTeam, 6) / 6) * 30 + // up to 30 from activity
            (Math.min(artifactActivityCount, 4) / 4) * 30 // up to 30 from artifact work
          )
        )
        // Minimum engagement floor if any activity at all
        if (messagesOnDate.length > 0 || activityOnDate.length > 0 || artifactActivityCount > 0) {
          engagement = Math.max(engagement, 15)
        }

        // --- AI-Supported Curve: teams interacting with AI personas perform better ---
        const aiMessages = messagesOnDate.filter(m => m.personaId !== null)
        const humanMessages = messagesOnDate.filter(m => m.userId !== null && m.personaId === null)
        const aiInteractionRatio = messagesOnDate.length > 0
          ? aiMessages.length / messagesOnDate.length
          : 0

        // AI-supported learning curve starts at baseline and rises faster when AI is used
        const baseProgress = artifactsUpToDate.length > 0
          ? Math.min(artifactsUpToDate.filter(a => a.status === 'approved' || a.status === 'submitted').length / Math.max(sortedSessions.length, 1), 1)
          : 0
        const aiSupportedCurve = Math.round(
          35 + // baseline
          baseProgress * 35 + // up to 35 from progress
          aiInteractionRatio * 20 + // up to 20 from AI usage
          (confidence > 60 ? 10 : confidence > 40 ? 5 : 0) // bonus from confidence
        )

        // --- Traditional Curve: what learning would look like without AI support ---
        // Follows similar trajectory but without the AI recovery boost, and the dip is deeper
        const traditionalCurve = Math.round(
          30 + // lower baseline
          baseProgress * 30 + // slower progress
          (humanMessages.length > 0 ? Math.min(humanMessages.length / (totalTeams * 3), 1) * 10 : 0) - // peer collaboration limited
          difficulty * 15 // difficulty drags this curve down more
        )

        return {
          date: dateStr,
          confidence: Math.max(0, Math.min(100, confidence)),
          engagement: Math.max(0, Math.min(100, engagement)),
          aiSupportedCurve: Math.max(0, Math.min(100, aiSupportedCurve)),
          traditionalCurve: Math.max(0, Math.min(100, traditionalCurve)),
        }
      })

      return { success: true, metrics: derivedMetrics }
    } catch (error) {
      console.error('Get learning metrics error:', error)
      return { success: false, error: 'Failed to get learning metrics' }
    }
  })

/**
 * Record a learning metric
 */
export const recordLearningMetric = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    projectId: string
    teamId?: string
    userId?: string
    metricType: 'confidence' | 'engagement' | 'ai_supported' | 'traditional'
    value: number
    source: 'survey' | 'ai_inferred' | 'system' | 'activity'
    metadata?: Record<string, unknown>
  }) => data)
  .handler(async ({ data }) => {
    try {
      const metricId = uuidv4()

      await db.insert(learningMetrics).values({
        id: metricId,
        projectId: data.projectId,
        teamId: data.teamId,
        userId: data.userId,
        metricType: data.metricType,
        value: Math.max(0, Math.min(100, data.value)), // Clamp to 0-100
        source: data.source,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        recordedAt: new Date(),
      })

      return { success: true, metricId }
    } catch (error) {
      console.error('Record learning metric error:', error)
      return { success: false, error: 'Failed to record metric' }
    }
  })

// ============================================================================
// AI INTERVENTIONS
// ============================================================================

// Map UI types to database types
const typeMapping: Record<string, 'inactivity' | 'conflict' | 'deadline' | 'engagement' | 'custom'> = {
  'proactive': 'custom',
  'reactive': 'engagement',
  'scheduled': 'deadline',
}

const statusMapping: Record<string, 'pending' | 'approved' | 'rejected' | 'executed'> = {
  'proposed': 'pending',
  'approved': 'approved',
  'rejected': 'rejected',
  'executed': 'executed',
}

const reverseStatusMapping: Record<string, 'proposed' | 'approved' | 'rejected' | 'executed'> = {
  'pending': 'proposed',
  'approved': 'approved',
  'rejected': 'rejected',
  'executed': 'executed',
}

/**
 * Get interventions for a project
 */
export const getProjectInterventions = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const interventions = await db.query.aiInterventions.findMany({
        where: eq(aiInterventions.projectId, data.projectId),
        orderBy: desc(aiInterventions.createdAt),
        with: {
          executor: true,
          team: true,
        },
      })

      return {
        success: true,
        interventions: interventions.map(i => ({
          id: i.id,
          type: i.type === 'custom' ? 'proactive' : i.type === 'engagement' ? 'reactive' : 'scheduled',
          description: i.proposedAction,
          targetTeamIds: i.teamId ? [i.teamId] : [],
          status: reverseStatusMapping[i.status] || i.status,
          timestamp: i.createdAt.toISOString(),
          proposedAt: i.createdAt.toISOString(),
          approvedAt: i.status === 'approved' ? i.createdAt.toISOString() : undefined,
          rejectedAt: i.status === 'rejected' ? i.createdAt.toISOString() : undefined,
          executedAt: i.executedAt?.toISOString(),
          createdBy: i.executor ? {
            id: i.executor.id,
            name: i.executor.name,
          } : null,
        })),
      }
    } catch (error) {
      console.error('Get project interventions error:', error)
      return { success: false, error: 'Failed to get interventions' }
    }
  })

/**
 * Create a new intervention
 */
export const createIntervention = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    projectId: string
    type: 'proactive' | 'reactive' | 'scheduled'
    description: string
    targetTeamIds: string[]
    createdBy?: string
  }) => data)
  .handler(async ({ data }) => {
    try {
      const interventionId = uuidv4()
      const dbType = typeMapping[data.type] || 'custom'
      
      // Create one intervention per target team
      const targetTeam = data.targetTeamIds[0] // Use first team, or null if none

      await db.insert(aiInterventions).values({
        id: interventionId,
        projectId: data.projectId,
        teamId: targetTeam || null,
        type: dbType,
        trigger: `Creator ${data.type} intervention`,
        proposedAction: data.description,
        status: 'pending',
        createdAt: new Date(),
      })

      return { success: true, interventionId }
    } catch (error) {
      console.error('Create intervention error:', error)
      return { success: false, error: 'Failed to create intervention' }
    }
  })

/**
 * Update intervention status
 */
export const updateInterventionStatus = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    interventionId: string
    status: 'approved' | 'rejected' | 'executed'
  }) => data)
  .handler(async ({ data }) => {
    try {
      const now = new Date()
      const dbStatus = statusMapping[data.status] || data.status
      const updates: Record<string, unknown> = { status: dbStatus }

      if (data.status === 'executed') {
        updates.executedAt = now
      }

      await db.update(aiInterventions)
        .set(updates)
        .where(eq(aiInterventions.id, data.interventionId))

      return { success: true }
    } catch (error) {
      console.error('Update intervention status error:', error)
      return { success: false, error: 'Failed to update intervention' }
    }
  })

// ============================================================================
// SUBMISSIONS & ASSESSMENT
// ============================================================================

/**
 * Get project submissions for assessment
 */
export const getProjectSubmissions = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      // Get all sessions for the project (with rubrics for weighted scoring)
      const sessions = await db.query.projectSessions.findMany({
        where: eq(projectSessions.projectId, data.projectId),
        orderBy: projectSessions.order,
        with: {
          rubrics: true,
        },
      })

      const sessionIds = sessions.map(s => s.id)

      if (sessionIds.length === 0) {
        return { success: true, submissions: [], stats: { total: 0, pending: 0, graded: 0, avgScore: 0 } }
      }

      // Get all artifacts for these sessions
      const allArtifacts = await db.query.artifacts.findMany({
        where: inArray(artifacts.sessionId, sessionIds),
        with: {
          user: true,
          team: true,
          precheckResults: {
            orderBy: desc(precheckResults.createdAt),
            limit: 1,
          },
        },
      })

      // Transform to submission format
      const submissions = allArtifacts.map(artifact => {
        const session = sessions.find(s => s.id === artifact.sessionId)
        const sessionRubrics = session?.rubrics || []
        const latestPrecheck = artifact.precheckResults[0]
        let aiScore = 0
        let rubricBreakdown: Array<{ criterion: string; weight: number; score: number | null }> =
          sessionRubrics.map((r) => ({
            criterion: r.criteria,
            weight: r.weight,
            score: null,
          }))

        const applyOverallScoreFallback = () => {
          switch (latestPrecheck?.overallScore) {
            case 'ready':
              aiScore = 85
              break
            case 'needs_work':
              aiScore = 65
              break
            case 'critical_issues':
              aiScore = 40
              break
            default:
              aiScore = 0
          }
        }
        
        // Calculate AI score from precheck rubric scores using weighted average
        if (latestPrecheck?.rubricScores) {
          try {
            const scores = JSON.parse(latestPrecheck.rubricScores) as Record<string, number>
            const entries = Object.entries(scores)
            if (entries.length > 0) {
              // Build weight lookup from session rubrics (by ID and criterion name)
              const rubrics = sessionRubrics
              const weightById = new Map(rubrics.map(r => [r.id, r.weight]))
              const weightByCriterion = new Map(rubrics.map(r => [r.criteria, r.weight]))
              const scoreById = new Map(Object.entries(scores))

              rubricBreakdown = rubrics.map((rubric) => {
                const rawScore = scoreById.get(rubric.id) ?? scoreById.get(rubric.criteria)
                return {
                  criterion: rubric.criteria,
                  weight: rubric.weight,
                  score: typeof rawScore === 'number' ? Math.round(rawScore) : null,
                }
              })

              let weightedSum = 0
              let totalWeight = 0
              for (const [key, score] of entries) {
                const weight = weightById.get(key) ?? weightByCriterion.get(key) ?? 0
                weightedSum += score * weight
                totalWeight += weight
              }

              aiScore = totalWeight > 0
                ? Math.round(weightedSum / totalWeight)
                : Math.round(entries.reduce((sum, [, s]) => sum + s, 0) / entries.length)
            } else {
              applyOverallScoreFallback()
            }
          } catch {
            applyOverallScoreFallback()
          }
        } else {
          applyOverallScoreFallback()
        }

        return {
          id: artifact.id,
          teamId: artifact.teamId,
          teamName: artifact.team.name,
          studentId: artifact.userId,
          studentName: artifact.user.name,
          sessionId: artifact.sessionId,
          sessionIndex: session?.order || 0,
          sessionTitle: session?.title || 'Unknown Session',
          aiScore,
          status: artifact.status === 'approved' ? 'graded' as const : 'pending' as const,
          submittedAt: artifact.updatedAt.toISOString(),
          precheckPassed: artifact.precheckPassed,
          rubricBreakdown,
        }
      })

      // Calculate stats
      const pendingCount = submissions.filter(s => s.status === 'pending').length
      const gradedCount = submissions.filter(s => s.status === 'graded').length
      const avgScore = submissions.length > 0
        ? Math.round(submissions.reduce((sum, s) => sum + s.aiScore, 0) / submissions.length)
        : 0

      return {
        success: true,
        submissions,
        stats: {
          total: submissions.length,
          pending: pendingCount,
          graded: gradedCount,
          avgScore,
        },
      }
    } catch (error) {
      console.error('Get project submissions error:', error)
      return { success: false, error: 'Failed to get submissions' }
    }
  })

/**
 * Grade (or re-grade) a submission.
 * Re-runs AI rubric scoring so the AI Score is always fresh, stores new
 * precheck results, then transitions the artifact to 'approved' (displayed
 * as "graded"). Accepts a single artifact ID or an array for batch grading.
 *
 * Returns the updated submissions so the client can refresh scores without
 * a full page reload.
 */
export const gradeSubmission = createServerFn({ method: 'POST' })
  .inputValidator((data: { artifactIds: string | string[] }) => data)
  .handler(async ({ data }) => {
    try {
      const ids = Array.isArray(data.artifactIds) ? data.artifactIds : [data.artifactIds]
      if (ids.length === 0) {
        return { success: false, error: 'No artifact IDs provided' }
      }

      // Fetch the artifacts with their session rubrics so we can re-score.
      const targetArtifacts = await db.query.artifacts.findMany({
        where: inArray(artifacts.id, ids),
        with: {
          session: {
            with: {
              rubrics: {
                orderBy: (rubrics, { asc }) => [asc(rubrics.order)],
              },
            },
          },
        },
      })

      const now = new Date()
      const updatedScores: Array<{
        artifactId: string
        aiScore: number
        rubricBreakdown: Array<{ criterion: string; weight: number; score: number | null }>
      }> = []

      for (const artifact of targetArtifacts) {
        // Re-run AI scoring using the same pipeline as submission-time scoring.
        const rubrics = artifact.session?.rubrics || []
        const content = artifact.content || ''

        if (content.trim() && rubrics.length > 0) {
          const generated = await generateSubmissionPrecheck(content, rubrics)

          // Store new precheck results.
          const precheckId = uuidv4()
          await db.insert(precheckResults).values({
            id: precheckId,
            artifactId: artifact.id,
            overallScore: generated.overallScore,
            feedback: JSON.stringify(generated.items),
            rubricScores: JSON.stringify(generated.rubricScores),
            createdAt: now,
          })

          if (generated.items.length > 0) {
            await db.insert(precheckFeedbackItems).values(
              generated.items.map((item) => ({
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

          // Compute weighted-average AI score (same algorithm as getProjectSubmissions).
          const entries = Object.entries(generated.rubricScores)
          let aiScore = 0
          if (entries.length > 0) {
            const weightByCriterion = new Map(rubrics.map(r => [r.criteria, r.weight]))
            let weightedSum = 0
            let totalWeight = 0
            for (const [key, s] of entries) {
              const weight = weightByCriterion.get(key) ?? 0
              weightedSum += s * weight
              totalWeight += weight
            }
            aiScore = totalWeight > 0
              ? Math.round(weightedSum / totalWeight)
              : Math.round(entries.reduce((sum, [, s]) => sum + s, 0) / entries.length)
          }

          updatedScores.push({
            artifactId: artifact.id,
            aiScore,
            rubricBreakdown: rubrics.map(r => ({
              criterion: r.criteria,
              weight: r.weight,
              score: generated.rubricScores[r.criteria] ?? null,
            })),
          })

          // Update artifact status and precheck metadata.
          await db.update(artifacts)
            .set({
              status: 'approved',
              lastPrecheckAt: now,
              precheckPassed: generated.overallScore !== 'critical_issues',
              updatedAt: now,
            })
            .where(eq(artifacts.id, artifact.id))
        } else {
          // No content or no rubrics – just approve without re-scoring.
          await db.update(artifacts)
            .set({ status: 'approved', updatedAt: now })
            .where(eq(artifacts.id, artifact.id))
        }
      }

      return { success: true, gradedCount: ids.length, updatedScores }
    } catch (error) {
      console.error('Grade submission error:', error)
      return { success: false, error: 'Failed to grade submission' }
    }
  })

// ============================================================================
// TEAM RISK ASSESSMENT
// ============================================================================

/**
 * Calculate and store team risk assessments
 */
export const calculateTeamRisks = createServerFn({ method: 'POST' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, data.projectId),
        with: {
          sessions: true,
        },
      })

      if (!project) {
        return { success: false, error: 'Project not found' }
      }

      // Get all teams with their artifacts
      const projectTeams = await db.query.teams.findMany({
        where: eq(teams.projectId, data.projectId),
        with: {
          members: true,
        },
      })

      const sessionIds = project.sessions.map(s => s.id)
      
      // Get all artifacts for the project
      const allArtifacts = await db.query.artifacts.findMany({
        where: inArray(artifacts.sessionId, sessionIds),
        with: {
          precheckResults: {
            orderBy: desc(precheckResults.createdAt),
            limit: 5,
          },
        },
      })

      const now = new Date()
      const assessments: Array<{
        id: string
        projectId: string
        teamId: string
        riskLevel: 'green' | 'yellow' | 'red'
        riskFactors: string
        lastActivityAt: Date | null
        sessionsBehind: number
        precheckFailureRate: number | null
        assessedAt: Date
      }> = []

      for (const team of projectTeams) {
        const teamArtifacts = allArtifacts.filter(a => a.teamId === team.id)
        
        // Calculate risk factors
        const riskFactors: string[] = []
        let riskLevel: 'green' | 'yellow' | 'red' = 'green'

        // 1. Check session progress
        const projectStart = project.startDate?.getTime() ?? 0
        const projectEnd = project.endDate?.getTime() ?? 0
        const projectDuration = projectEnd - projectStart
        const expectedSessions = projectDuration > 0 && projectStart > 0
          ? Math.floor(
              (now.getTime() - projectStart) / projectDuration * project.sessions.length
            )
          : 0
        const completedSessions = teamArtifacts.filter(a => 
          a.status === 'approved' || a.status === 'submitted'
        ).length
        const sessionsBehind = Math.max(0, expectedSessions - completedSessions)

        if (sessionsBehind >= 2) {
          riskFactors.push(`${sessionsBehind} sessions behind schedule`)
          riskLevel = 'red'
        } else if (sessionsBehind === 1) {
          riskFactors.push('1 session behind schedule')
          if (riskLevel !== 'red') riskLevel = 'yellow'
        }

        // 2. Check precheck failure rate
        const allPrechecks = teamArtifacts.flatMap(a => a.precheckResults)
        const failedPrechecks = allPrechecks.filter(p => p.overallScore === 'critical_issues').length
        const precheckFailureRate = allPrechecks.length > 0
          ? Math.round((failedPrechecks / allPrechecks.length) * 100)
          : null

        if (precheckFailureRate !== null && precheckFailureRate > 50) {
          riskFactors.push(`High precheck failure rate (${precheckFailureRate}%)`)
          riskLevel = 'red'
        } else if (precheckFailureRate !== null && precheckFailureRate > 30) {
          riskFactors.push(`Elevated precheck failure rate (${precheckFailureRate}%)`)
          if (riskLevel !== 'red') riskLevel = 'yellow'
        }

        // 3. Check last activity
        const lastArtifactUpdate = teamArtifacts.reduce((latest, a) => {
          return a.updatedAt > latest ? a.updatedAt : latest
        }, new Date(0))

        const daysSinceActivity = Math.floor(
          (now.getTime() - lastArtifactUpdate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceActivity > 7) {
          riskFactors.push(`No activity for ${daysSinceActivity} days`)
          riskLevel = 'red'
        } else if (daysSinceActivity > 3) {
          riskFactors.push(`Limited activity (${daysSinceActivity} days ago)`)
          if (riskLevel !== 'red') riskLevel = 'yellow'
        }

        assessments.push({
          id: uuidv4(),
          projectId: data.projectId,
          teamId: team.id,
          riskLevel,
          riskFactors: JSON.stringify(riskFactors),
          lastActivityAt: lastArtifactUpdate.getTime() > 0 ? lastArtifactUpdate : null,
          sessionsBehind,
          precheckFailureRate,
          assessedAt: now,
        })
      }

      // Store assessments
      if (assessments.length > 0) {
        await db.insert(teamRiskAssessments).values(assessments)
      }

      return {
        success: true,
        assessments: assessments.map(a => ({
          teamId: a.teamId,
          riskLevel: a.riskLevel,
          riskFactors: JSON.parse(a.riskFactors),
        })),
      }
    } catch (error) {
      console.error('Calculate team risks error:', error)
      return { success: false, error: 'Failed to calculate team risks' }
    }
  })

// ============================================================================
// AI PERSONAS
// ============================================================================

/**
 * Get all available AI personas
 */
export const getAiPersonas = createServerFn({ method: 'GET' })
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
      console.error('Get AI personas error:', error)
      return { success: false, error: 'Failed to get AI personas' }
    }
  })
