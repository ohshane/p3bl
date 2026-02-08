import { create } from 'zustand'
import type { ProjectTab, WorkspaceMode } from '@/types'
import {
  getUserProjects,
  getProject,
  joinProject as apiJoinProject,
} from '@/server/api/projects'
import {
  getUserArtifacts,
  getUserSessionArtifacts,
  createArtifact as apiCreateArtifact,
  updateArtifact as apiUpdateArtifact,
  submitArtifact as apiSubmitArtifact,
} from '@/server/api/artifacts'

import { getProjectTimeStatus } from '@/lib/utils'

// Types for API-returned data
export interface UserProject {
  id: string
  title: string
  description: string | null
  teamId: string
  teamName: string
  teamSize: number
  currentSessionId: string | null
  currentSessionIndex: number
  sessionCount: number
  sessions?: Array<{
    id: string
    title: string
    startDate?: string
    endDate?: string
  }>
  creatorName: string
  startDate: string | null
  endDate: string | null
  joinedAt: string
}

export interface UserArtifact {
  id: string
  title: string
  contentType: string
  status: string
  projectId: string
  projectTitle: string
  sessionId: string
  sessionTitle: string
  latestVersion: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionArtifact {
  id: string
  title: string
  contentType: string
  status: string
  content: string | null
  versionCount: number
  latestVersion: string | null
  createdAt: string
  updatedAt: string
  lastPrecheckAt: string | null
}

interface ProjectState {
  // Cached data
  userProjects: UserProject[]
  userArtifacts: UserArtifact[]
  sessionArtifacts: Record<string, SessionArtifact[]> // keyed by sessionId
  
  // Loading states
  isLoadingProjects: boolean
  isLoadingArtifacts: boolean
  projectsError: string | null
  artifactsError: string | null
  
  // UI State
  currentProjectId: string | null
  activeTab: ProjectTab
  
  // Async actions
  fetchUserProjects: (userId: string) => Promise<void>
  fetchUserArtifacts: (userId: string) => Promise<void>
  fetchSessionArtifacts: (userId: string, sessionId: string) => Promise<void>
  
  // Computed getters (time-based status)
  getAllUserProjects: () => UserProject[]
  getScheduledProjects: () => UserProject[]
  getOpenedProjects: () => UserProject[]
  getClosedProjects: () => UserProject[]
  
  // Workspace mode
  getWorkspaceMode: () => WorkspaceMode
  
  // Actions
  setCurrentProject: (projectId: string | null) => void
  setActiveTab: (tab: ProjectTab) => void
  
  // Project actions
  joinProject: (userId: string, code: string) => Promise<{ success: boolean; projectId?: string; error?: string }>
  
  // Artifact actions
  createArtifact: (data: {
    userId: string
    sessionId: string
    teamId: string
    title: string
    content?: string
    contentType?: 'document' | 'code' | 'markdown'
  }) => Promise<{ success: boolean; artifactId?: string; error?: string }>
  
  updateArtifact: (artifactId: string, updates: { title?: string; content?: string }) => Promise<{ success: boolean; error?: string }>
  
  submitArtifact: (artifactId: string, userId: string) => Promise<{ success: boolean; version?: string; error?: string }>
  
  // Get artifact for a session
  getSessionArtifact: (sessionId: string) => SessionArtifact | undefined
  
  // Clear cache
  clearCache: () => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  userProjects: [],
  userArtifacts: [],
  sessionArtifacts: {},
  
  isLoadingProjects: false,
  isLoadingArtifacts: false,
  projectsError: null,
  artifactsError: null,
  
  currentProjectId: null,
  activeTab: 'opened',
  
  fetchUserProjects: async (userId: string) => {
    // Only show loading spinner on initial load (when no projects cached yet)
    const hasProjects = get().userProjects.length > 0
    if (!hasProjects) {
      set({ isLoadingProjects: true, projectsError: null })
    }
    try {
      const result = await getUserProjects({ data: { userId } })
      if (result.success && result.projects) {
        set({ userProjects: result.projects, isLoadingProjects: false })
      } else {
        set({ projectsError: result.error || 'Failed to fetch projects', isLoadingProjects: false })
      }
    } catch (error) {
      if (!hasProjects) {
        set({ projectsError: 'Failed to fetch projects', isLoadingProjects: false })
      }
    }
  },
  
  fetchUserArtifacts: async (userId: string) => {
    set({ isLoadingArtifacts: true, artifactsError: null })
    try {
      const result = await getUserArtifacts({ data: { userId } })
      if (result.success && result.artifacts) {
        set({ userArtifacts: result.artifacts, isLoadingArtifacts: false })
      } else {
        set({ artifactsError: result.error || 'Failed to fetch artifacts', isLoadingArtifacts: false })
      }
    } catch (error) {
      set({ artifactsError: 'Failed to fetch artifacts', isLoadingArtifacts: false })
    }
  },
  
  fetchSessionArtifacts: async (userId: string, sessionId: string) => {
    try {
      const result = await getUserSessionArtifacts({ data: { userId, sessionId } })
      if (result.success && result.artifacts) {
        set(state => ({
          sessionArtifacts: {
            ...state.sessionArtifacts,
            [sessionId]: result.artifacts,
          },
        }))
      }
    } catch (error) {
      console.error('Failed to fetch session artifacts:', error)
    }
  },
  
  getAllUserProjects: () => {
    return get().userProjects
  },

  getScheduledProjects: () => {
    return get().userProjects.filter(p => getProjectTimeStatus(p.startDate, p.endDate) === 'scheduled')
  },

  getOpenedProjects: () => {
    return get().userProjects.filter(p => getProjectTimeStatus(p.startDate, p.endDate) === 'opened')
  },
  
  getClosedProjects: () => {
    return get().userProjects.filter(p => getProjectTimeStatus(p.startDate, p.endDate) === 'closed')
  },
  
  getWorkspaceMode: () => {
    // If user has any projects, they're in active mode
    return get().userProjects.length > 0 ? 'active' : 'onboarding'
  },
  
  setCurrentProject: (projectId: string | null) => {
    set({ currentProjectId: projectId })
  },
  
  setActiveTab: (tab: ProjectTab) => {
    set({ activeTab: tab })
  },
  
  joinProject: async (userId: string, code: string) => {
    try {
      const result = await apiJoinProject({ data: { userId, code } })
      if (result.success && result.projectId) {
        // Refresh user's projects after joining
        await get().fetchUserProjects(userId)
        return { success: true, projectId: result.projectId }
      }
      return { success: false, error: result.error || 'Failed to join project' }
    } catch (error) {
      return { success: false, error: 'Failed to join project' }
    }
  },
  
  createArtifact: async (data) => {
    try {
      const result = await apiCreateArtifact({ data })
      if (result.success && result.artifactId) {
        // Refresh session artifacts
        await get().fetchSessionArtifacts(data.userId, data.sessionId)
        return { success: true, artifactId: result.artifactId }
      }
      return { success: false, error: result.error || 'Failed to create artifact' }
    } catch (error) {
      return { success: false, error: 'Failed to create artifact' }
    }
  },
  
  updateArtifact: async (artifactId: string, updates) => {
    try {
      const result = await apiUpdateArtifact({ data: { artifactId, ...updates } })
      if (result.success) {
        // Update local cache
        set(state => {
          const newSessionArtifacts = { ...state.sessionArtifacts }
          for (const sessionId of Object.keys(newSessionArtifacts)) {
            newSessionArtifacts[sessionId] = newSessionArtifacts[sessionId].map(a =>
              a.id === artifactId
                ? { ...a, ...updates, updatedAt: new Date().toISOString() }
                : a
            )
          }
          return { sessionArtifacts: newSessionArtifacts }
        })
        return { success: true }
      }
      return { success: false, error: result.error || 'Failed to update artifact' }
    } catch (error) {
      return { success: false, error: 'Failed to update artifact' }
    }
  },
  
  submitArtifact: async (artifactId: string, userId: string) => {
    try {
      const result = await apiSubmitArtifact({ data: { artifactId, userId } })
      if (result.success && result.version) {
        // Update local cache
        set(state => {
          const newSessionArtifacts = { ...state.sessionArtifacts }
          for (const sessionId of Object.keys(newSessionArtifacts)) {
            newSessionArtifacts[sessionId] = newSessionArtifacts[sessionId].map(a =>
              a.id === artifactId
                ? { ...a, status: 'submitted', latestVersion: result.version, updatedAt: new Date().toISOString() }
                : a
            )
          }
          return { sessionArtifacts: newSessionArtifacts }
        })
        return { success: true, version: result.version }
      }
      return { success: false, error: result.error || 'Failed to submit artifact' }
    } catch (error) {
      return { success: false, error: 'Failed to submit artifact' }
    }
  },
  
  getSessionArtifact: (sessionId: string) => {
    const artifacts = get().sessionArtifacts[sessionId]
    return artifacts?.[0] // Return first artifact for the session
  },
  
  clearCache: () => {
    set({
      userProjects: [],
      userArtifacts: [],
      sessionArtifacts: {},
      projectsError: null,
      artifactsError: null,
    })
  },
}))
