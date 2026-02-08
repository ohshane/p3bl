// ============================================================================
// P3BL Explorer MVP - Type Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// User & Authentication Types
// ----------------------------------------------------------------------------

export type UserRole = 'explorer' | 'creator' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  role: UserRole[]
  level: number
  xp: number
  anonymizedName: string
  joinedProjectIds: string[]
  earnedBadgeIds: string[]
  pendingInvitations: ProjectInvitation[]
  competencies: CompetencyScores
  createdAt: string
}

export interface ProjectInvitation {
  id: string
  projectId: string
  projectName: string
  invitedAt: string
  expiresAt: string | null
}

// ----------------------------------------------------------------------------
// Level System
// ----------------------------------------------------------------------------

export interface LevelDefinition {
  level: number
  name: string
  xpRequired: number
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, name: 'Newcomer', xpRequired: 0 },
  { level: 2, name: 'Learner', xpRequired: 100 },
  { level: 3, name: 'Explorer', xpRequired: 300 },
  { level: 4, name: 'Navigator', xpRequired: 600 },
  { level: 5, name: 'Pioneer', xpRequired: 1000 },
  { level: 6, name: 'Master', xpRequired: 1500 },
]

export const XP_REWARDS = {
  submitArtifact: 20,
  artifactApproved: 30,
  completeSession: 25,
  completeProject: 100,
  earnBadge: 15,
  chatMessage: 1, // max 10/day
  shareArtifact: 5,
} as const

// ----------------------------------------------------------------------------
// Project & Session Types
// ----------------------------------------------------------------------------

export type ProjectStatus = 'scheduled' | 'opened' | 'closed'
export type DeliverableType = 'none' | 'document'

export interface Project {
  id: string
  name: string
  description: string
  creatorId: string
  creatorName: string
  startDate: string | null
  endDate: string | null
  teamId: string
  currentSessionIndex: number
  sessions: Session[]
  joinCode: string
  createdAt: string
  completedAt: string | null
  isWaiting?: boolean
}

export interface Session {
  id: string
  index: number
  title: string
  topic: string
  startDate: string
  endDate: string
  deliverableType: DeliverableType
  guide: string
  resources: Resource[]
  rubric: RubricItem[]
  templates: Template[]
  completedAt: string | null
}

export interface Resource {
  id: string
  title: string
  type: 'pdf' | 'link' | 'video' | 'document' | 'image'
  url: string
}

export interface RubricItem {
  id: string
  criterion: string
  description: string
  weight: number
}

export interface Template {
  id: string
  name: string
  content: string
}

// ----------------------------------------------------------------------------
// Team Types
// ----------------------------------------------------------------------------

export interface Team {
  id: string
  name: string
  projectId: string
  memberIds: string[]
  aiPersonaIds: string[]
}

export interface AIPersona {
  id: string
  name: string
  avatar: string | null
  role: string
  personality: string
  expertise: string[]
}

// ----------------------------------------------------------------------------
// Artifact & Submission Types
// ----------------------------------------------------------------------------

export type SubmissionStatus =
  | 'draft'
  | 'precheck_pending'
  | 'precheck_complete'
  | 'submitted'
  | 'under_review'
  | 'needs_revision'
  | 'approved'

export interface Artifact {
  id: string
  userId: string
  projectId: string
  sessionId: string
  title: string
  content: string
  deliverableType: DeliverableType
  status: SubmissionStatus
  versions: ArtifactVersion[]
  currentVersion: string
  preCheckResult: PreCheckResult | null
  expertFeedback: ExpertFeedback[]
  createdAt: string
  updatedAt: string
  submittedAt: string | null
}

export interface ArtifactVersion {
  id: string
  version: string // e.g., "v1.0", "v1.1"
  content: string
  submittedAt: string
  preCheckResult: PreCheckResult | null
}

export interface PreCheckResult {
  id: string
  overallStatus: 'ready' | 'needs_work' | 'critical_issues'
  score: number
  items: PreCheckItem[]
  generatedAt: string
}

export interface PreCheckItem {
  id: string
  rubricItemId: string
  severity: 'critical' | 'warning' | 'suggestion'
  message: string
  suggestion: string
}

export interface ExpertFeedback {
  id: string
  expertId: string
  expertName: string
  comment: string
  status: 'approved' | 'needs_revision'
  createdAt: string
}

// ----------------------------------------------------------------------------
// Chat Types
// ----------------------------------------------------------------------------

export type MessageSender = 'user' | 'ai' | 'system'

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  senderType: MessageSender
  content: string
  timestamp: string
  artifactCard?: ArtifactCard
}

export interface ArtifactCard {
  artifactId: string
  title: string
  thumbnail: string | null
  sessionName: string
  snippet: string
}

// ----------------------------------------------------------------------------
// Badge & Achievement Types
// ----------------------------------------------------------------------------

export type BadgeCategory = 'milestone' | 'engagement' | 'collaboration' | 'competency'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  category: BadgeCategory
  icon: string
  criteria: string
}

export interface EarnedBadge {
  badgeId: string
  earnedAt: string
  context: string // e.g., project name where earned
}

// Badge definitions from PRD
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Milestone
  { id: 'first-steps', name: 'First Steps', description: 'Submit first artifact in any project', category: 'milestone', icon: 'footprints', criteria: 'first_artifact' },
  { id: 'project-pioneer', name: 'Project Pioneer', description: 'Complete first project', category: 'milestone', icon: 'flag', criteria: 'first_project' },
  { id: 'seasoned-explorer', name: 'Seasoned Explorer', description: 'Complete 3 projects', category: 'milestone', icon: 'compass', criteria: 'complete_3_projects' },
  { id: 'master-explorer', name: 'Master Explorer', description: 'Complete 5 projects', category: 'milestone', icon: 'star', criteria: 'complete_5_projects' },
  // Engagement
  { id: 'early-bird', name: 'Early Bird', description: 'Submit artifact 24+ hours before deadline', category: 'engagement', icon: 'sun', criteria: 'early_submission' },
  { id: 'consistent-contributor', name: 'Consistent Contributor', description: 'Submit on-time for 5 consecutive sessions', category: 'engagement', icon: 'calendar', criteria: 'consecutive_submissions' },
  { id: 'team-player', name: 'Team Player', description: 'Send 50+ chat messages across all projects', category: 'engagement', icon: 'message-circle', criteria: 'chat_messages' },
  // Collaboration
  { id: 'helping-hand', name: 'Helping Hand', description: 'Share 5+ artifacts to team chat', category: 'collaboration', icon: 'hand-helping', criteria: 'share_artifacts' },
  { id: 'feedback-friend', name: 'Feedback Friend', description: 'Receive "helpful" reactions on 3+ shared artifacts', category: 'collaboration', icon: 'heart', criteria: 'helpful_reactions' },
  // Competency
  { id: 'critical-thinker', name: 'Critical Thinker', description: 'Reach 70+ in Critical Thinking competency', category: 'competency', icon: 'brain', criteria: 'competency_critical_thinking' },
  { id: 'communicator', name: 'Communicator', description: 'Reach 70+ in Communication competency', category: 'competency', icon: 'megaphone', criteria: 'competency_communication' },
  { id: 'collaborator', name: 'Collaborator', description: 'Reach 70+ in Collaboration competency', category: 'competency', icon: 'users', criteria: 'competency_collaboration' },
  { id: 'creative-mind', name: 'Creative Mind', description: 'Reach 70+ in Creativity competency', category: 'competency', icon: 'lightbulb', criteria: 'competency_creativity' },
  { id: 'problem-solver', name: 'Problem Solver', description: 'Reach 70+ in Problem Solving competency', category: 'competency', icon: 'puzzle', criteria: 'competency_problem_solving' },
]

// ----------------------------------------------------------------------------
// Competency Types
// ----------------------------------------------------------------------------

export type CompetencyType =
  | 'criticalThinking'
  | 'communication'
  | 'collaboration'
  | 'creativity'
  | 'problemSolving'

export interface CompetencyScores {
  criticalThinking: CompetencyScore
  communication: CompetencyScore
  collaboration: CompetencyScore
  creativity: CompetencyScore
  problemSolving: CompetencyScore
}

export interface CompetencyScore {
  current: number
  baseline: number | null
  lastUpdated: string
  insight: string
}

export const COMPETENCY_LABELS: Record<CompetencyType, string> = {
  criticalThinking: 'Critical Thinking',
  communication: 'Communication',
  collaboration: 'Collaboration',
  creativity: 'Creativity',
  problemSolving: 'Problem Solving',
}

// ----------------------------------------------------------------------------
// Notification Types
// ----------------------------------------------------------------------------

export type NotificationType =
  | 'new_feedback'
  | 'review_complete'
  | 'session_unlocked'
  | 'deadline_reminder'
  | 'team_message'
  | 'badge_earned'
  | 'level_up'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  projectId: string | null
  read: boolean
  createdAt: string
  actionUrl: string | null
}

// ----------------------------------------------------------------------------
// Showcase Link Types
// ----------------------------------------------------------------------------

export type ShowcaseLinkExpiration = '7days' | '30days' | '90days' | 'never'

export interface ShowcaseLink {
  id: string
  artifactId: string
  url: string
  expiresAt: string | null
  createdAt: string
  isActive: boolean
}

// ----------------------------------------------------------------------------
// UI State Types
// ----------------------------------------------------------------------------

export type WorkspaceMode = 'onboarding' | 'active'
export type ProjectTab = 'all' | 'scheduled' | 'opened' | 'closed'
export type PortfolioTab = 'artifacts' | 'competencies' | 'achievements'
export type VoyagePanel = 'reflection' | 'cockpit' | 'preview'

// ----------------------------------------------------------------------------
// Creator Types (C.x)
// ----------------------------------------------------------------------------

export type CreatorProjectStatus = 'scheduled' | 'opened' | 'closed'
export type RiskLevel = 'green' | 'yellow' | 'red'
export type WizardMode = 'manual' | 'keyword' | 'document' | 'quickstart'
export type TeamFormationMode = 'manual' | 'automatic'
export type ProjectMode = 'personal' | 'team'
export type SessionDifficulty = 'easy' | 'medium' | 'hard'

export interface CreatorProject {
  id: string
  name: string
  description: string
  drivingQuestion: string

  creatorId: string
  joinCode: string
  qrCode: string | null
  totalParticipants: number
  teamSize: number
  teamFormationMode: TeamFormationMode
  startDate: string
  endDate: string
  sessions: CreatorSession[]
  teams: CreatorTeam[]
  aiPersonaIds: string[]
  expertIds: string[]
  riskLevel: RiskLevel
  createdAt: string

  completedAt: string | null
}

export interface CreatorSession {
  id: string
  index: number
  title: string
  topic: string
  guide: string
  difficulty: SessionDifficulty // Difficulty level affects time allocation
  weight: number // For asymmetric timeline (calculated from difficulty)
  startDate: string
  endDate: string
  deliverableType: DeliverableType
  rubric: RubricItem[]
  resources: Resource[]
  templates: Template[]
  llmModel: string // For multi-chatbot control
}

export interface CreatorTeam {
  id: string
  name: string
  memberIds: string[]
  aiPersonaIds: string[]
  riskLevel: RiskLevel
  riskReason: string | null
  lastActivityAt: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string | null
  status: 'active' | 'inactive' | 'at_risk'
  completedSessions: number
  currentSessionProgress: number
  lastActiveAt: string
}

export interface ExpertProfile {
  id: string
  name: string
  email: string
  expertise: string[]
  bio: string
  avatar: string | null
}

// Dip Chart Data (C.1.3)
export interface DipChartDataPoint {
  date: string
  confidence: number
  engagement: number
  traditionalCurve: number
  aiSupportedCurve: number
}

export interface AIIntervention {
  id: string
  timestamp: string
  type: 'proactive' | 'reactive'
  description: string
  targetTeamIds: string[]
  status: 'proposed' | 'approved' | 'executed' | 'rejected'
}

// Project Creation Wizard State (C.2)
export interface WizardState {
  mode: WizardMode
  currentStep: number
  totalSteps: number
  
  // Step 1: Content Analysis & Setup
  uploadedFiles: UploadedFile[]
  ragProcessingStatus: 'idle' | 'processing' | 'complete' | 'error'
  basicInfo: {
    title: string
    background: string
    drivingQuestion: string
  }
  
  // Step 2: AI Classmate Setup
  selectedAIPersonaIds: string[]
  
  // Step 3: Scale & Team Setup
  participantParams: {
    projectMode: ProjectMode
    teamSize: number
  }
  
  // Step 4: Overall Timeline
  timeline: {
    startDate: string // ISO datetime string
    endDate: string   // ISO datetime string
  }
  
  // Step 5-6: Sessions & Asymmetric Timeline
  sessions: Omit<CreatorSession, 'id'>[]
  
  // Validation
  isValid: boolean
  validationErrors: Record<string, string>
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
}

// Monitoring Types (C.3)
export interface LiveMatrixEntry {
  teamId: string
  teamName: string
  riskLevel: RiskLevel
  members: TeamMember[]
  sessionProgress: Array<{
    sessionIndex: number
    status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'needs_revision'
    submittedAt: string | null
  }>
}

export interface AssessmentDraft {
  id: string
  studentId: string
  projectId: string
  sessionId: string
  aiGeneratedScore: number
  aiGeneratedFeedback: string
  rubricScores: Array<{
    rubricItemId: string
    score: number
    feedback: string
  }>
  creatorAdjustedScore: number | null
  creatorFeedback: string | null
  status: 'draft' | 'finalized'
  generatedAt: string
  finalizedAt: string | null
}


