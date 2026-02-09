import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CreatorProject,
  CreatorSession,
  WizardState,
  WizardMode,
  AIPersona,
  LiveMatrixEntry,
  AssessmentDraft,
  AIIntervention,
  DipChartDataPoint,
  SessionDifficulty,
} from '@/types'
import {
  getCreatorProjects,
  getCreatorDashboardStats,
  getProjectTeamsWithProgress,
  getProjectParticipants,
  getLearningMetrics,
  getProjectInterventions as fetchInterventions,
  createIntervention,
  updateInterventionStatus,
  getAiPersonas,
  createProject as apiCreateProject,
  deleteProject as apiDeleteProject,
  resetJoinCode as apiResetJoinCode,
  createSession as apiCreateSession,
  addRubric as apiAddRubric,
  addResource as apiAddResource,
  addTemplate as apiAddTemplate,
  removeParticipant as apiRemoveParticipant,
} from '@/server/api'

// Default wizard state
const defaultWizardState: WizardState = {
  mode: 'keyword',
  currentStep: 1,
  totalSteps: 6,
  uploadedFiles: [],
  ragProcessingStatus: 'idle',
  basicInfo: {
    title: '',
    background: '',
    drivingQuestion: '',
  },
  selectedAIPersonaIds: [],
  participantParams: {
    projectMode: 'team',
    teamSize: 2,
  },
  timeline: {
    startDate: '',
    endDate: '',
  },
  sessions: [],
  isValid: false,
  validationErrors: {},
}

// Difficulty to weight mapping
const DIFFICULTY_WEIGHTS: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 60,
  medium: 100,
  hard: 140,
}

// Helper to create default session
function createDefaultSession(
  index: number,
  difficulty: SessionDifficulty = 'medium'
): Omit<CreatorSession, 'id'> {
  return {
    index,
    title: `Session ${index + 1}`,
    topic: '',
    guide: '',
    difficulty,
    weight: DIFFICULTY_WEIGHTS[difficulty],
    startDate: '',
    endDate: '',
    deliverableType: 'document',
    rubric: [],
    resources: [],
    templates: [],
    llmModel: 'gpt-4',
  }
}

interface ProjectParticipant {
  id: string
  name: string
  email: string
  avatar: string | null
  teamId: string | null
  teamName: string | null
  joinedAt: string
}

interface CreatorState {
  // Data
  projects: CreatorProject[]
  aiPersonas: AIPersona[]
  assessmentDrafts: AssessmentDraft[]
  interventions: AIIntervention[]
  
  // Dashboard stats
  dashboardStats: {
    scheduledProjects: number
    openedProjects: number
    closedProjects: number
    totalLearners: number
    projectsAtRisk: number
  }
  
  // Cached data for monitoring
  liveMatrixCache: Map<string, LiveMatrixEntry[]>
  dipChartCache: Map<string, DipChartDataPoint[]>
  participantsCache: Map<string, { total: number; waiting: ProjectParticipant[]; assigned: ProjectParticipant[]; removed: ProjectParticipant[] }>
  
  // Loading states
  isLoading: boolean
  isLoadingMatrix: boolean
  isLoadingMetrics: boolean
  error: string | null
  
  // Wizard state
  wizardState: WizardState

  // Persisted defaults
  lastSessionDifficulty: SessionDifficulty
  
  // UI State
  currentProjectId: string | null
  activeView: 'dashboard' | 'monitoring' | 'assessment'
  
  // Dashboard getters (use cached data)
  getAllProjects: () => CreatorProject[]
  getScheduledProjects: () => CreatorProject[]
  getOpenedProjects: () => CreatorProject[]
  getClosedProjects: () => CreatorProject[]
  getProject: (projectId: string) => CreatorProject | undefined
  
  // Monitoring getters (from cache)
  getLiveMatrix: (projectId: string) => LiveMatrixEntry[]
  getDipChartData: (projectId: string) => DipChartDataPoint[]
  getProjectInterventions: (projectId: string) => AIIntervention[]
  getParticipants: (projectId: string) => { total: number; waiting: ProjectParticipant[]; assigned: ProjectParticipant[]; removed: ProjectParticipant[] } | null
  
  // Async data fetching actions
  fetchProjects: (creatorId: string) => Promise<void>
  fetchDashboardStats: (creatorId: string) => Promise<void>
  fetchLiveMatrix: (projectId: string) => Promise<void>
  fetchDipChartData: (projectId: string) => Promise<void>
  fetchInterventions: (projectId: string) => Promise<void>
  fetchAiPersonas: () => Promise<void>
  fetchParticipants: (projectId: string) => Promise<void>
  
  // Actions
  setCurrentProject: (projectId: string | null) => void
  setActiveView: (view: 'dashboard' | 'monitoring' | 'assessment') => void
  clearError: () => void
  
  // Wizard actions
  setWizardMode: (mode: WizardMode) => void
  setWizardStep: (step: number) => void
  nextStep: () => { success: boolean; error?: string }
  prevStep: () => void
  updateBasicInfo: (info: Partial<WizardState['basicInfo']>) => void
  setSelectedAIPersonas: (ids: string[]) => void
  updateParticipantParams: (params: Partial<WizardState['participantParams']>) => void
  setTimeline: (timeline: WizardState['timeline']) => void
  setLastSessionDifficulty: (difficulty: SessionDifficulty) => void
  addSession: () => void
  updateSession: (index: number, updates: Partial<Omit<CreatorSession, 'id'>>) => void
  removeSession: (index: number) => void
  setSessions: (sessions: Omit<CreatorSession, 'id'>[]) => void
  quickStart: (data: {
    basicInfo: WizardState['basicInfo']
    sessions: Omit<CreatorSession, 'id'>[]
    timeline: WizardState['timeline']
  }) => void
  resetWizard: () => void
  validateWizard: () => boolean
  
  // Project actions (now async)
  createProject: (creatorId: string) => Promise<CreatorProject | null>
  deleteProject: (projectId: string) => Promise<boolean>
  regenerateJoinCode: (projectId: string, creatorId: string) => Promise<string | null>
  
  // Team actions
  removeParticipant: (projectId: string, userId: string) => Promise<boolean>
  updateTeamRisk: (projectId: string, teamId: string, riskLevel: 'green' | 'yellow' | 'red', reason: string | null) => void
  
  // Intervention actions (now async)
  proposeIntervention: (projectId: string, intervention: Omit<AIIntervention, 'id' | 'status'>, creatorId?: string) => Promise<void>
  approveIntervention: (interventionId: string) => Promise<void>
  rejectIntervention: (interventionId: string) => Promise<void>
  
  // Assessment actions
  updateAssessmentDraft: (draftId: string, updates: Partial<AssessmentDraft>) => void
  finalizeAssessment: (draftId: string) => void
}

export const useCreatorStore = create<CreatorState>()(
  persist(
    (set, get) => ({
      // Initialize with empty data - will be fetched from API
      projects: [],
      aiPersonas: [],
      experts: [],
      assessmentDrafts: [],
      interventions: [],
      
      dashboardStats: {
        scheduledProjects: 0,
        openedProjects: 0,
        closedProjects: 0,
        totalLearners: 0,
        projectsAtRisk: 0,
      },
      
      liveMatrixCache: new Map(),
      dipChartCache: new Map(),
      participantsCache: new Map(),
      
      isLoading: false,
      isLoadingMatrix: false,
      isLoadingMetrics: false,
      error: null,
      
      wizardState: { ...defaultWizardState },

      lastSessionDifficulty: 'medium',
      
      currentProjectId: null,
      activeView: 'dashboard',
      
      // Dashboard getters - categorize by dates
      getAllProjects: () => {
        return get().projects
      },
      
      getScheduledProjects: () => {
        const now = new Date()
        return get().projects.filter(p => {
          if (!p.startDate) return false
          return new Date(p.startDate) > now
        })
      },
      
      getOpenedProjects: () => {
        const now = new Date()
        return get().projects.filter(p => {
          if (!p.startDate) return true // No start date = treat as opened
          const startDate = new Date(p.startDate)
          const endDate = p.endDate ? new Date(p.endDate) : null
          return startDate <= now && (!endDate || endDate > now)
        })
      },
      
      getClosedProjects: () => {
        const now = new Date()
        return get().projects.filter(p => {
          if (!p.endDate) return false
          return new Date(p.endDate) <= now
        })
      },
      
      getProject: (projectId: string) => {
        return get().projects.find(p => p.id === projectId)
      },
      
      // Monitoring getters (from cache or empty)
      getLiveMatrix: (projectId: string) => {
        return get().liveMatrixCache.get(projectId) || []
      },
      
      getDipChartData: (projectId: string) => {
        return get().dipChartCache.get(projectId) || []
      },
      
      getProjectInterventions: (projectId: string) => {
        const project = get().getProject(projectId)
        if (!project) return []
        return get().interventions.filter(i => 
          i.targetTeamIds.some(teamId => 
            project.teams.some(t => t.id === teamId)
          )
        )
      },
      
      getParticipants: (projectId: string) => {
        return get().participantsCache.get(projectId) || null
      },
      
      // Async data fetching
      fetchProjects: async (creatorId: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await getCreatorProjects({ data: { creatorId } })
          if (result.success && result.projects) {
            // Transform API response to CreatorProject format
            const transformedProjects: CreatorProject[] = result.projects.map((p: any) => ({
              id: p.id,
              name: p.title,
              description: p.description || '',
              drivingQuestion: p.drivingQuestion || '',
              creatorId: p.creatorId,
              joinCode: p.joinCode,
              qrCode: null,
              totalParticipants: p.maxParticipants || 0,
              teamSize: p.teamSize || 4,
              teamFormationMode: 'automatic' as const,
              startDate: p.startDate || '',
              endDate: p.endDate || '',
              sessions: p.sessions?.map((s: any, idx: number) => {
                const difficulty = s.difficulty || 'medium'
                return {
                  id: s.id,
                  index: s.order || idx,
                  title: s.title,
                  topic: s.topic || '',
                  guide: s.guide || '',
                  difficulty,
                  weight: s.weight ?? DIFFICULTY_WEIGHTS[difficulty as SessionDifficulty],
                  startDate: s.startDate || '',
                  endDate: s.endDate || '',
                  deliverableType: s.deliverableType || 'document',
                  rubric: (s.rubrics || []).map((r: any) => ({
                    id: r.id,
                    criterion: r.criteria,
                    description: r.description || '',
                    weight: r.weight,
                  })),
                  resources: [],
                  templates: [],
                  llmModel: s.llmModel || 'gpt-4',
                }
              }) || [],
              teams: [], // Will be populated by fetchLiveMatrix
              aiPersonaIds: [],
              expertIds: [],
              riskLevel: 'green' as const,
              createdAt: p.createdAt,
              completedAt: null,
            }))
            set({ projects: transformedProjects, isLoading: false })
          } else {
            set({ error: result.error || 'Failed to fetch projects', isLoading: false })
          }
        } catch (error) {
          set({ error: 'Failed to fetch projects', isLoading: false })
        }
      },
      
      fetchDashboardStats: async (creatorId: string) => {
        try {
          const result = await getCreatorDashboardStats({ data: { creatorId } })
          if (result.success && result.stats) {
            set({ dashboardStats: result.stats })
          }
        } catch (error) {
          console.error('Failed to fetch dashboard stats:', error)
        }
      },
      
      fetchLiveMatrix: async (projectId: string) => {
        set({ isLoadingMatrix: true })
        try {
          const result = await getProjectTeamsWithProgress({ data: { projectId } })
          if (result.success && result.teams) {
            const matrixEntries: LiveMatrixEntry[] = result.teams.map((t: any) => ({
              teamId: t.teamId,
              teamName: t.teamName,
              riskLevel: t.riskLevel,
              members: t.members,
              sessionProgress: t.sessionProgress.map((sp: any) => ({
                sessionIndex: sp.sessionIndex,
                status: sp.status,
                submittedAt: sp.submittedAt,
                statusUpdatedAt: sp.statusUpdatedAt,
              })),
            }))
            
            const newCache = new Map(get().liveMatrixCache)
            newCache.set(projectId, matrixEntries)
            
            // Also update teams in the project
            set(state => ({
              liveMatrixCache: newCache,
              isLoadingMatrix: false,
              projects: state.projects.map(p => 
                p.id === projectId
                  ? {
                      ...p,
                      teams: result.teams.map((t: any) => ({
                        id: t.teamId,
                        name: t.teamName,
                        memberIds: t.members.map((m: any) => m.id),
                        aiPersonaIds: [],
                        riskLevel: t.riskLevel,
                        riskReason: t.riskReason,
                        lastActivityAt: t.lastActivityAt,
                      })),
                    }
                  : p
              ),
            }))
          } else {
            set({ isLoadingMatrix: false })
          }
        } catch (error) {
          console.error('Failed to fetch live matrix:', error)
          set({ isLoadingMatrix: false })
        }
      },
      
      fetchParticipants: async (projectId: string) => {
        try {
          const result = await getProjectParticipants({ data: { projectId } })
          if (result.success && result.participants) {
            const newCache = new Map(get().participantsCache)
            newCache.set(projectId, result.participants)
            set({ participantsCache: newCache })
          }
        } catch (error) {
          console.error('Failed to fetch participants:', error)
        }
      },
      
      fetchDipChartData: async (projectId: string) => {
        set({ isLoadingMetrics: true })
        try {
          const result = await getLearningMetrics({ data: { projectId, days: 30 } })
          if (result.success && result.metrics) {
            const chartData: DipChartDataPoint[] = result.metrics.map((m: any) => ({
              date: m.date,
              confidence: m.confidence,
              engagement: m.engagement,
              aiSupportedCurve: m.aiSupportedCurve,
              traditionalCurve: m.traditionalCurve,
            }))
            
            const newCache = new Map(get().dipChartCache)
            newCache.set(projectId, chartData)
            set({ dipChartCache: newCache, isLoadingMetrics: false })
          } else {
            set({ isLoadingMetrics: false })
          }
        } catch (error) {
          console.error('Failed to fetch dip chart data:', error)
          set({ isLoadingMetrics: false })
        }
      },
      
      fetchInterventions: async (projectId: string) => {
        try {
          const result = await fetchInterventions({ data: { projectId } })
          if (result.success && result.interventions) {
            const newInterventions: AIIntervention[] = result.interventions.map((i: any) => ({
              id: i.id,
              timestamp: i.timestamp,
              type: i.type as 'proactive' | 'reactive',
              description: i.description,
              targetTeamIds: i.targetTeamIds,
              status: i.status,
            }))
            
            // Merge with existing interventions (replace those for this project)
            set(state => {
              const project = state.projects.find(p => p.id === projectId)
              const projectTeamIds = project?.teams.map(t => t.id) || []
              const otherInterventions = state.interventions.filter(i =>
                !i.targetTeamIds.some(tid => projectTeamIds.includes(tid))
              )
              return { interventions: [...otherInterventions, ...newInterventions] }
            })
          }
        } catch (error) {
          console.error('Failed to fetch interventions:', error)
        }
      },
      
      fetchAiPersonas: async () => {
        try {
          const result = await getAiPersonas()
          if (result.success && result.personas) {
            const personas: AIPersona[] = result.personas.map((p: any) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              role: p.type,
              personality: p.description || '',
              expertise: p.expertise || [],
            }))
            set({ aiPersonas: personas })
          }
        } catch (error) {
          console.error('Failed to fetch AI personas:', error)
        }
      },
      
      // Actions
      setCurrentProject: (projectId: string | null) => {
        set({ currentProjectId: projectId })
      },
      
      setActiveView: (view: 'dashboard' | 'monitoring' | 'assessment') => {
        set({ activeView: view })
      },
      
      clearError: () => {
        set({ error: null })
      },
      
      // Wizard actions
      setWizardMode: (mode: WizardMode) => {
        set(state => ({
          wizardState: { ...state.wizardState, mode },
        }))
      },
      
      setWizardStep: (step: number) => {
        const { wizardState } = get()
        if (step >= 1 && step <= wizardState.totalSteps) {
          set(state => ({
            wizardState: { ...state.wizardState, currentStep: step },
          }))
        }
      },
      
      nextStep: () => {
        const { wizardState } = get()
        
        // Validate current step before proceeding
        const step = wizardState.currentStep
        
        // Step 2: Content validation
        if (step === 2) {
          if (!wizardState.basicInfo.title.trim()) {
            return { success: false, error: 'Project title is required' }
          }
          if (!wizardState.basicInfo.drivingQuestion.trim()) {
            return { success: false, error: 'Driving question is required' }
          }
        }
        
        // Step 3: Teams validation
        if (step === 3) {
          if (wizardState.participantParams.projectMode === 'team' && wizardState.participantParams.teamSize < 2) {
            return { success: false, error: 'Team size must be at least 2' }
          }
        }
        
        // Step 4: Timeline validation
        if (step === 4) {
          if (!wizardState.timeline.startDate) {
            return { success: false, error: 'Start date is required' }
          }
          if (!wizardState.timeline.endDate) {
            return { success: false, error: 'End date is required' }
          }
        }
        
        // Step 5: Sessions validation
        if (step === 5) {
          if (wizardState.sessions.length === 0) {
            return { success: false, error: 'At least one session is required' }
          }
          // Validate rubric weights sum to 100% for sessions with deliverables
          for (const session of wizardState.sessions) {
            if (session.deliverableType !== 'none' && session.rubric.length > 0) {
              const totalWeight = session.rubric.reduce((sum, r) => sum + r.weight, 0)
              if (totalWeight !== 100) {
                return { success: false, error: `Rubric weights for "${session.title || 'Untitled session'}" must add up to 100% (currently ${totalWeight}%)` }
              }
            }
          }
        }
        
        if (wizardState.currentStep < wizardState.totalSteps) {
          set(state => ({
            wizardState: { ...state.wizardState, currentStep: state.wizardState.currentStep + 1 },
          }))
        }
        
        return { success: true }
      },
      
      prevStep: () => {
        const { wizardState } = get()
        if (wizardState.currentStep > 1) {
          set(state => ({
            wizardState: { ...state.wizardState, currentStep: state.wizardState.currentStep - 1 },
          }))
        }
      },
      
      updateBasicInfo: (info: Partial<WizardState['basicInfo']>) => {
        set(state => ({
          wizardState: {
            ...state.wizardState,
            basicInfo: { ...state.wizardState.basicInfo, ...info },
          },
        }))
      },
      
      setSelectedAIPersonas: (ids: string[]) => {
        set(state => ({
          wizardState: { ...state.wizardState, selectedAIPersonaIds: ids },
        }))
      },
      
      updateParticipantParams: (params: Partial<WizardState['participantParams']>) => {
        set(state => ({
          wizardState: {
            ...state.wizardState,
            participantParams: { ...state.wizardState.participantParams, ...params },
          },
        }))
      },
      
      setTimeline: (timeline: WizardState['timeline']) => {
        set(state => ({
          wizardState: { ...state.wizardState, timeline },
        }))
      },

      setLastSessionDifficulty: (difficulty: SessionDifficulty) => {
        set({ lastSessionDifficulty: difficulty })
      },
      
      addSession: () => {
        set(state => {
          const newIndex = state.wizardState.sessions.length
          return {
            wizardState: {
              ...state.wizardState,
              sessions: [
                ...state.wizardState.sessions,
                createDefaultSession(newIndex, state.lastSessionDifficulty),
              ],
            },
          }
        })
      },
      
      updateSession: (index: number, updates: Partial<Omit<CreatorSession, 'id'>>) => {
        set(state => ({
          wizardState: {
            ...state.wizardState,
            sessions: state.wizardState.sessions.map((s, i) => {
              if (i !== index) return s
              // If difficulty changes, auto-update weight
              const newUpdates = { ...updates }
              if (updates.difficulty && updates.difficulty !== s.difficulty) {
                newUpdates.weight = DIFFICULTY_WEIGHTS[updates.difficulty as SessionDifficulty]
              }
              return { ...s, ...newUpdates }
            }),
          },
          lastSessionDifficulty:
            updates.difficulty && updates.difficulty !== state.wizardState.sessions[index]?.difficulty
              ? (updates.difficulty as SessionDifficulty)
              : state.lastSessionDifficulty,
        }))
      },
      
      removeSession: (index: number) => {
        set(state => ({
          wizardState: {
            ...state.wizardState,
            sessions: state.wizardState.sessions
              .filter((_, i) => i !== index)
              .map((s, i) => ({ ...s, index: i })),
          },
        }))
      },
      
      setSessions: (sessions: Omit<CreatorSession, 'id'>[]) => {
        set(state => ({
          wizardState: {
            ...state.wizardState,
            sessions: sessions.map((s, i) => ({ ...s, index: i })),
          },
          lastSessionDifficulty:
            sessions.length > 0
              ? (sessions[sessions.length - 1].difficulty as SessionDifficulty)
              : state.lastSessionDifficulty,
        }))
      },
      
      quickStart: (data) => {
        set(state => ({
          wizardState: {
            ...state.wizardState,
            mode: 'quickstart',
            basicInfo: data.basicInfo,
            selectedAIPersonaIds: ['persona_sage', 'persona_spark'],
            participantParams: {
              projectMode: 'team',
              teamSize: 2,
            },
            timeline: data.timeline,
            sessions: data.sessions,
            isValid: true,
            validationErrors: {},
          },
          lastSessionDifficulty:
            data.sessions.length > 0
              ? (data.sessions[data.sessions.length - 1].difficulty as SessionDifficulty)
              : state.lastSessionDifficulty,
        }))
      },
      
      resetWizard: () => {
        set({ wizardState: { ...defaultWizardState } })
      },
      
      validateWizard: () => {
        const { wizardState } = get()
        const errors: Record<string, string> = {}
        
        // Step 1 validation
        if (!wizardState.basicInfo.title.trim()) {
          errors.title = 'Project title is required'
        }
        if (!wizardState.basicInfo.drivingQuestion.trim()) {
          errors.drivingQuestion = 'Driving question is required'
        }
        
        // Step 4 validation (team formation)
        if (wizardState.participantParams.projectMode === 'team' && wizardState.participantParams.teamSize < 2) {
          errors.teamSize = 'Team size must be at least 2'
        }
        
        // Step 4 validation
        if (!wizardState.timeline.startDate) {
          errors.startDate = 'Start date is required'
        }
        if (!wizardState.timeline.endDate) {
          errors.endDate = 'End date is required'
        }
        
        // Step 5 validation
        if (wizardState.sessions.length === 0) {
          errors.sessions = 'At least one session is required'
        }
        
        const isValid = Object.keys(errors).length === 0
        
        set(state => ({
          wizardState: { ...state.wizardState, isValid, validationErrors: errors },
        }))
        
        return isValid
      },
      
      // Project actions (async)
      createProject: async (creatorId: string) => {
        const { wizardState, validateWizard } = get()
        
        if (!validateWizard()) {
          return null
        }
        
        try {
          // For personal mode, teamSize is 1; for team mode, use the configured size
          const effectiveTeamSize = wizardState.participantParams.projectMode === 'personal' 
            ? 1 
            : wizardState.participantParams.teamSize
          
          const result = await apiCreateProject({
            data: {
              creatorId,
              title: wizardState.basicInfo.title,
              description: wizardState.basicInfo.background,
              drivingQuestion: wizardState.basicInfo.drivingQuestion,
              teamSize: effectiveTeamSize,
              startDate: wizardState.timeline.startDate,
              endDate: wizardState.timeline.endDate,
            },
          })
          
          if (result.success && result.project) {
            const projectId = result.project.id
            
            // Save sessions to the database
            const createdSessionIds: string[] = []
            for (const session of wizardState.sessions) {
              try {
                const sessionResult = await apiCreateSession({
                  data: {
                    projectId,
                    title: session.title,
                    topic: session.topic,
                    guide: session.guide,
                    weight: session.weight,
                    difficulty: session.difficulty,
                    deliverableType: session.deliverableType,
                    startDate: session.startDate,
                    endDate: session.endDate,
                    llmModel: session.llmModel,
                  },
                })
                
                if (sessionResult.success && sessionResult.sessionId) {
                  createdSessionIds.push(sessionResult.sessionId)
                  
                  // Add rubrics for this session
                  for (const rubric of session.rubric) {
                    await apiAddRubric({
                      data: {
                        sessionId: sessionResult.sessionId,
                        criteria: rubric.criterion,
                        description: rubric.description,
                        weight: rubric.weight,
                      },
                    })
                  }
                  
                  // Add resources for this session
                  for (const resource of session.resources) {
                    await apiAddResource({
                      data: {
                        sessionId: sessionResult.sessionId,
                        type: resource.type,
                        title: resource.title,
                        url: resource.url,
                      },
                    })
                  }
                  
                  // Add templates for this session
                  for (const template of session.templates) {
                    await apiAddTemplate({
                      data: {
                        sessionId: sessionResult.sessionId,
                        name: template.name,
                        content: template.content,
                        type: 'document' as const, // Default type for templates
                      },
                    })
                  }
                }
              } catch (sessionError) {
                console.error('Failed to create session:', sessionError)
              }
            }
            
            // Create local project representation with real session IDs
            const now = new Date().toISOString()
            const newProject: CreatorProject = {
              id: projectId,
              name: wizardState.basicInfo.title,
              description: wizardState.basicInfo.background,
              drivingQuestion: wizardState.basicInfo.drivingQuestion,
              creatorId,
              joinCode: result.project.joinCode,
              qrCode: null,
              totalParticipants: 0,
              teamSize: effectiveTeamSize,
              teamFormationMode: 'automatic',
              startDate: wizardState.timeline.startDate,
              endDate: wizardState.timeline.endDate,
              sessions: wizardState.sessions.map((s, idx) => ({
                ...s,
                id: createdSessionIds[idx] || `session_${projectId}_${idx}`,
              })),
              teams: [],
              aiPersonaIds: wizardState.selectedAIPersonaIds,
              expertIds: [],
              riskLevel: 'green',
              createdAt: now,
              completedAt: null,
            }
            
            set(state => ({
              projects: [...state.projects, newProject],
              wizardState: { ...defaultWizardState },
            }))
            
            return newProject
          }
          
          set({ error: result.error || 'Failed to create project' })
          return null
        } catch (error) {
          set({ error: 'Failed to create project' })
          return null
        }
      },
      
      deleteProject: async (projectId: string) => {
        try {
          const result = await apiDeleteProject({ data: { projectId } })
          
          if (result.success) {
            set(state => ({
              projects: state.projects.filter(p => p.id !== projectId),
            }))
            return true
          }
          
          set({ error: result.error || 'Failed to delete project' })
          return false
        } catch (error) {
          set({ error: 'Failed to delete project' })
          return false
        }
      },
      
      regenerateJoinCode: async (projectId: string, creatorId: string) => {
        try {
          const result = await apiResetJoinCode({ data: { projectId, creatorId } })
          
          if (result.success && result.joinCode) {
            set(state => ({
              projects: state.projects.map(p =>
                p.id === projectId
                  ? { ...p, joinCode: result.joinCode }
                  : p
              ),
            }))
            return result.joinCode
          }
          
          return null
        } catch (error) {
          return null
        }
      },
      
      // Team actions
      removeParticipant: async (projectId: string, userId: string) => {
        try {
          const result = await apiRemoveParticipant({ data: { projectId, userId } })
          if (result.success) {
            // Refresh participants and live matrix
            await get().fetchParticipants(projectId)
            await get().fetchLiveMatrix(projectId)
            return true
          }
          return false
        } catch (error) {
          console.error('Failed to remove participant:', error)
          return false
        }
      },
      
      updateTeamRisk: (projectId: string, teamId: string, riskLevel: 'green' | 'yellow' | 'red', reason: string | null) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  teams: p.teams.map(t =>
                    t.id === teamId
                      ? { ...t, riskLevel, riskReason: reason }
                      : t
                  ),
                }
              : p
          ),
        }))
      },
      
      // Intervention actions (async)
      proposeIntervention: async (projectId: string, intervention: Omit<AIIntervention, 'id' | 'status'>, creatorId?: string) => {
        try {
          const result = await createIntervention({
            data: {
              projectId,
              type: intervention.type,
              description: intervention.description,
              targetTeamIds: intervention.targetTeamIds,
              createdBy: creatorId,
            },
          })
          
          if (result.success && result.interventionId) {
            const newIntervention: AIIntervention = {
              ...intervention,
              id: result.interventionId,
              status: 'proposed',
            }
            set(state => ({
              interventions: [...state.interventions, newIntervention],
            }))
          }
        } catch (error) {
          console.error('Failed to create intervention:', error)
        }
      },
      
      approveIntervention: async (interventionId: string) => {
        try {
          const result = await updateInterventionStatus({
            data: { interventionId, status: 'approved' },
          })
          
          if (result.success) {
            set(state => ({
              interventions: state.interventions.map(i =>
                i.id === interventionId
                  ? { ...i, status: 'approved' as const }
                  : i
              ),
            }))
          }
        } catch (error) {
          console.error('Failed to approve intervention:', error)
        }
      },
      
      rejectIntervention: async (interventionId: string) => {
        try {
          const result = await updateInterventionStatus({
            data: { interventionId, status: 'rejected' },
          })
          
          if (result.success) {
            set(state => ({
              interventions: state.interventions.map(i =>
                i.id === interventionId
                  ? { ...i, status: 'rejected' as const }
                  : i
              ),
            }))
          }
        } catch (error) {
          console.error('Failed to reject intervention:', error)
        }
      },
      
      // Assessment actions
      updateAssessmentDraft: (draftId: string, updates: Partial<AssessmentDraft>) => {
        set(state => ({
          assessmentDrafts: state.assessmentDrafts.map(d =>
            d.id === draftId
              ? { ...d, ...updates }
              : d
          ),
        }))
      },
      
      finalizeAssessment: (draftId: string) => {
        set(state => ({
          assessmentDrafts: state.assessmentDrafts.map(d =>
            d.id === draftId
              ? { ...d, status: 'finalized' as const, finalizedAt: new Date().toISOString() }
              : d
          ),
        }))
      },
    }),
    {
      name: 'p3bl-creator',
      partialize: (state) => ({
        wizardState: state.wizardState,
        currentProjectId: state.currentProjectId,
        lastSessionDifficulty: state.lastSessionDifficulty,
        // Don't persist projects - fetch fresh from API
      }),
    }
  )
)
