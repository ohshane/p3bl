import { useAuthStore } from '@/stores/authStore'
import { useProjectStore } from '@/stores/projectStore'
import { getProjectTimeStatus } from '@/lib/utils'

export interface UserContext {
  user: {
    name: string
    role: string
    level: number
    xp: number
  } | null
  workspace: {
    mode: 'onboarding' | 'active'
    totalProjects: number
    openedProjects: number
    closedProjects: number
  }
  currentProjects: Array<{
    name: string
    status: 'scheduled' | 'opened' | 'closed'
    currentSession: string
    progress: string
    dueDate: string | null
  }>
  artifacts: {
    total: number
    submitted: number
    approved: number
    needsRevision: number
  }
  faq: string[]
}

// FAQ items for the assistant to reference
const PLATFORM_FAQ = [
  "Join codes are 6-character alphanumeric codes provided by instructors to join projects.",
  "Each project has multiple sessions. Complete sessions in order by submitting artifacts.",
  "Artifacts are your work submissions - documents, code, or markdown files.",
  "Pre-check reviews your artifact before final submission to catch issues early.",
  "Team chat allows collaboration with your project teammates and AI assistants.",
  "XP (experience points) are earned by submitting artifacts, completing sessions, and engaging with the platform.",
  "Levels are earned by accumulating XP: Newcomer (L1), Learner (L2), Explorer (L3), Navigator (L4), Pioneer (L5), Master (L6).",
  "Badges are achievements earned for milestones, engagement, collaboration, and competency growth.",
  "The portfolio section shows all your completed artifacts and competency scores.",
  "Competencies tracked: Critical Thinking, Communication, Collaboration, Creativity, Problem Solving.",
]

/**
 * Build user context string for the AI assistant
 */
export function buildUserContextString(): string {
  const authStore = useAuthStore.getState()
  const projectStore = useProjectStore.getState()
  
  const currentUser = authStore.currentUser
  
  if (!currentUser) {
    return `
USER CONTEXT:
- Not logged in

PLATFORM FAQ:
${PLATFORM_FAQ.map((faq, i) => `${i + 1}. ${faq}`).join('\n')}
`
  }
  
  // Get user's projects from store (already filtered to user's joined projects)
  const userProjects = projectStore.userProjects ?? []
  
  // Use time-based status
  const openedProjects = userProjects.filter(p => 
    getProjectTimeStatus(p.startDate, p.endDate) === 'opened'
  )
  const closedProjects = userProjects.filter(p => 
    getProjectTimeStatus(p.startDate, p.endDate) === 'closed'
  )
  
  // Get user's artifacts (artifacts may not be loaded yet)
  const userArtifacts: Array<{ status: string }> = []
  
  // Build project details
  const projectDetails = openedProjects.slice(0, 3).map(project => {
    return `  - "${project.title}": ${project.sessionCount} sessions`
  }).join('\n')
  
  // Build artifact stats
  const artifactStats = {
    total: userArtifacts.length,
    submitted: userArtifacts.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
    approved: userArtifacts.filter(a => a.status === 'approved').length,
    needsRevision: userArtifacts.filter(a => a.status === 'needs_revision').length,
    draft: userArtifacts.filter(a => a.status === 'draft').length,
  }
  
  const workspaceMode = openedProjects.length === 0 ? 'onboarding' : 'active'
  
  return `
USER CONTEXT:
- Name: ${currentUser.name}
- Role: ${currentUser.role}
- Level: ${currentUser.level} (${currentUser.xp} XP)

WORKSPACE STATUS:
- Mode: ${workspaceMode}
- Total Projects: ${userProjects.length}
- Opened Projects: ${openedProjects.length}
- Closed Projects: ${closedProjects.length}

${openedProjects.length > 0 ? `CURRENT PROJECTS:\n${projectDetails}` : 'No opened projects - user needs to join a project using a join code.'}

ARTIFACT PROGRESS:
- Total Artifacts: ${artifactStats.total}
- In Draft: ${artifactStats.draft}
- Submitted: ${artifactStats.submitted}
- Approved: ${artifactStats.approved}
- Needs Revision: ${artifactStats.needsRevision}

PLATFORM FAQ:
${PLATFORM_FAQ.map((faq, i) => `${i + 1}. ${faq}`).join('\n')}

INSTRUCTIONS FOR ASSISTANT:
- Use the above context to provide personalized, relevant responses.
- If user is in onboarding mode, focus on helping them join their first project.
- If user has opened projects, help them with session progress and artifact submission.
- Reference specific project names and session details when relevant.
- Be encouraging and supportive of their learning journey.
`
}

/**
 * Get structured user context object
 */
export function getUserContext(): UserContext {
  const authStore = useAuthStore.getState()
  const projectStore = useProjectStore.getState()
  
  const currentUser = authStore.currentUser
  
  if (!currentUser) {
    return {
      user: null,
      workspace: {
        mode: 'onboarding',
        totalProjects: 0,
        openedProjects: 0,
        closedProjects: 0,
      },
      currentProjects: [],
      artifacts: {
        total: 0,
        submitted: 0,
        approved: 0,
        needsRevision: 0,
      },
      faq: PLATFORM_FAQ,
    }
  }
  
  // Get user's projects from store (already filtered to user's joined projects)
  const userProjects = projectStore.userProjects ?? []
  
  // Use time-based status
  const openedProjects = userProjects.filter(p => 
    getProjectTimeStatus(p.startDate, p.endDate) === 'opened'
  )
  const closedProjects = userProjects.filter(p => 
    getProjectTimeStatus(p.startDate, p.endDate) === 'closed'
  )
  
  // Artifacts are loaded on-demand, so we don't include them in context for now
  const userArtifacts: Array<{ status: string }> = []
  
  return {
    user: {
      name: currentUser.name,
      role: currentUser.role,
      level: currentUser.level,
      xp: currentUser.xp,
    },
    workspace: {
      mode: openedProjects.length === 0 ? 'onboarding' : 'active',
      totalProjects: userProjects.length,
      openedProjects: openedProjects.length,
      closedProjects: closedProjects.length,
    },
    currentProjects: openedProjects.slice(0, 3).map(project => {
      return {
        name: project.title,
        status: getProjectTimeStatus(project.startDate, project.endDate),
        currentSession: 'N/A', // Would need more data to determine
        progress: `${project.sessionCount} sessions`,
        dueDate: project.endDate || null,
      }
    }),
    artifacts: {
      total: userArtifacts.length,
      submitted: userArtifacts.filter(a => a.status === 'submitted' || a.status === 'under_review').length,
      approved: userArtifacts.filter(a => a.status === 'approved').length,
      needsRevision: userArtifacts.filter(a => a.status === 'needs_revision').length,
    },
    faq: PLATFORM_FAQ,
  }
}
