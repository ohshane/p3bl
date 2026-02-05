/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectStore } from '@/stores/projectStore'
import { act, renderHook } from '@testing-library/react'

// Mock the JSON imports
vi.mock('@/data/projects.json', () => ({
  default: [
    {
      id: 'project_001',
      title: 'Test Project 1',
      description: 'A test project',
      status: 'active',
      joinCode: 'ABC123',
      teamId: 'team_001',
      sessions: [
        { id: 'session_001', title: 'Session 1', order: 1 },
        { id: 'session_002', title: 'Session 2', order: 2 },
      ],
    },
    {
      id: 'project_002',
      title: 'Test Project 2',
      description: 'Another test project',
      status: 'completed',
      joinCode: 'XYZ789',
      teamId: 'team_002',
      sessions: [],
    },
    {
      id: 'project_003',
      title: 'Draft Project',
      description: 'A draft project',
      status: 'draft',
      joinCode: 'DRF456',
      teamId: null,
      sessions: [],
    },
  ],
}))

vi.mock('@/data/teams.json', () => ({
  default: [
    {
      id: 'team_001',
      name: 'Team Alpha',
      projectId: 'project_001',
      memberIds: ['user_001', 'user_002'],
      aiPersonaIds: ['ai_001'],
    },
    {
      id: 'team_002',
      name: 'Team Beta',
      projectId: 'project_002',
      memberIds: ['user_003'],
      aiPersonaIds: [],
    },
  ],
}))

vi.mock('@/data/ai-personas.json', () => ({
  default: [
    {
      id: 'ai_001',
      name: 'Professor Sage',
      type: 'tutor',
      description: 'A wise tutor',
    },
    {
      id: 'ai_002',
      name: 'Critical Cat',
      type: 'critic',
      description: 'A constructive critic',
    },
  ],
}))

vi.mock('@/data/artifacts.json', () => ({
  default: [
    {
      id: 'artifact_001',
      projectId: 'project_001',
      sessionId: 'session_001',
      userId: 'user_001',
      title: 'My First Artifact',
      content: 'Some content here',
      status: 'draft',
      versions: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'artifact_002',
      projectId: 'project_001',
      sessionId: 'session_002',
      userId: 'user_001',
      title: 'Submitted Artifact',
      content: 'Completed content',
      status: 'submitted',
      currentVersion: 'v1.0',
      versions: [
        { id: 'ver_001', version: 'v1.0', content: 'Completed content', submittedAt: '2024-01-02T00:00:00Z' },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    },
  ],
}))

describe('Project Store', () => {
  beforeEach(() => {
    // Reset the store before each test
    useProjectStore.setState({
      currentProjectId: null,
      activeTab: 'active',
    })
  })

  describe('Project Getters', () => {
    it('should get a project by ID', () => {
      const { result } = renderHook(() => useProjectStore())

      const project = result.current.getProject('project_001')
      expect(project).toBeDefined()
      expect(project?.title).toBe('Test Project 1')
    })

    it('should return undefined for non-existent project', () => {
      const { result } = renderHook(() => useProjectStore())

      const project = result.current.getProject('non_existent')
      expect(project).toBeUndefined()
    })

    it('should get active projects', () => {
      const { result } = renderHook(() => useProjectStore())

      const activeProjects = result.current.getActiveProjects('user_001')
      expect(activeProjects.length).toBe(1)
      expect(activeProjects[0].status).toBe('active')
    })

    it('should get completed projects', () => {
      const { result } = renderHook(() => useProjectStore())

      const completedProjects = result.current.getCompletedProjects('user_001')
      expect(completedProjects.length).toBe(1)
      expect(completedProjects[0].status).toBe('completed')
    })
  })

  describe('Team Getters', () => {
    it('should get a team by ID', () => {
      const { result } = renderHook(() => useProjectStore())

      const team = result.current.getTeam('team_001')
      expect(team).toBeDefined()
      expect(team?.name).toBe('Team Alpha')
    })

    it('should get team by project ID', () => {
      const { result } = renderHook(() => useProjectStore())

      const team = result.current.getTeamByProject('project_001')
      expect(team).toBeDefined()
      expect(team?.id).toBe('team_001')
    })

    it('should return undefined for project without team', () => {
      const { result } = renderHook(() => useProjectStore())

      const team = result.current.getTeamByProject('project_003')
      expect(team).toBeUndefined()
    })
  })

  describe('AI Persona Getters', () => {
    it('should get an AI persona by ID', () => {
      const { result } = renderHook(() => useProjectStore())

      const persona = result.current.getAIPersona('ai_001')
      expect(persona).toBeDefined()
      expect(persona?.name).toBe('Professor Sage')
      expect(persona?.type).toBe('tutor')
    })

    it('should return undefined for non-existent persona', () => {
      const { result } = renderHook(() => useProjectStore())

      const persona = result.current.getAIPersona('non_existent')
      expect(persona).toBeUndefined()
    })
  })

  describe('Artifact Getters', () => {
    it('should get project artifacts', () => {
      const { result } = renderHook(() => useProjectStore())

      const artifacts = result.current.getProjectArtifacts('project_001')
      expect(artifacts.length).toBe(2)
    })

    it('should return empty array for project without artifacts', () => {
      const { result } = renderHook(() => useProjectStore())

      const artifacts = result.current.getProjectArtifacts('project_003')
      expect(artifacts.length).toBe(0)
    })

    it('should get session artifact', () => {
      const { result } = renderHook(() => useProjectStore())

      const artifact = result.current.getSessionArtifact('project_001', 'session_001')
      expect(artifact).toBeDefined()
      expect(artifact?.title).toBe('My First Artifact')
    })

    it('should return undefined for session without artifact', () => {
      const { result } = renderHook(() => useProjectStore())

      const artifact = result.current.getSessionArtifact('project_002', 'session_001')
      expect(artifact).toBeUndefined()
    })
  })

  describe('UI State', () => {
    it('should set current project', () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.setCurrentProject('project_001')
      })

      expect(result.current.currentProjectId).toBe('project_001')
    })

    it('should clear current project', () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.setCurrentProject('project_001')
      })

      act(() => {
        result.current.setCurrentProject(null)
      })

      expect(result.current.currentProjectId).toBeNull()
    })

    it('should set active tab', () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.setActiveTab('completed')
      })

      expect(result.current.activeTab).toBe('completed')
    })
  })

  describe('Join Project', () => {
    it('should add user to team when joining project', () => {
      const { result } = renderHook(() => useProjectStore())

      const team = result.current.getTeam('team_001')
      const initialMemberCount = team?.memberIds.length ?? 0

      act(() => {
        result.current.joinProject('user_new', 'project_001')
      })

      const updatedTeam = result.current.getTeam('team_001')
      expect(updatedTeam?.memberIds).toContain('user_new')
      expect(updatedTeam?.memberIds.length).toBe(initialMemberCount + 1)
    })

    it('should not add duplicate member to team', () => {
      const { result } = renderHook(() => useProjectStore())

      const team = result.current.getTeam('team_001')
      const initialMemberCount = team?.memberIds.length ?? 0

      act(() => {
        result.current.joinProject('user_001', 'project_001') // Already a member
      })

      const updatedTeam = result.current.getTeam('team_001')
      expect(updatedTeam?.memberIds.length).toBe(initialMemberCount)
    })
  })

  describe('Artifact CRUD', () => {
    it('should create a new artifact', () => {
      const { result } = renderHook(() => useProjectStore())

      const initialCount = result.current.artifacts.length

      let newArtifact: any
      act(() => {
        newArtifact = result.current.createArtifact({
          projectId: 'project_001',
          sessionId: 'session_003',
          userId: 'user_001',
          title: 'New Artifact',
          content: 'Initial content',
          contentType: 'document',
          status: 'draft',
          versions: [],
        })
      })

      expect(result.current.artifacts.length).toBe(initialCount + 1)
      expect(newArtifact.id).toBeDefined()
      expect(newArtifact.createdAt).toBeDefined()
    })

    it('should update an artifact', () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.updateArtifact('artifact_001', {
          title: 'Updated Title',
          content: 'Updated content',
        })
      })

      const artifact = result.current.artifacts.find(a => a.id === 'artifact_001')
      expect(artifact?.title).toBe('Updated Title')
      expect(artifact?.content).toBe('Updated content')
    })

    it('should submit an artifact and create a version', () => {
      const { result } = renderHook(() => useProjectStore())

      act(() => {
        result.current.submitArtifact('artifact_001')
      })

      const artifact = result.current.artifacts.find(a => a.id === 'artifact_001')
      expect(artifact?.status).toBe('submitted')
      expect(artifact?.versions.length).toBe(1)
      expect(artifact?.currentVersion).toBe('v1.0')
    })

    it('should increment version number on resubmit', () => {
      const { result } = renderHook(() => useProjectStore())

      // artifact_002 already has v1.0
      act(() => {
        result.current.submitArtifact('artifact_002')
      })

      const artifact = result.current.artifacts.find(a => a.id === 'artifact_002')
      expect(artifact?.versions.length).toBe(2)
      expect(artifact?.currentVersion).toBe('v1.1')
    })
  })

  describe('Join Code Validation', () => {
    it('should validate a correct join code', () => {
      const { result } = renderHook(() => useProjectStore())

      const validation = result.current.validateJoinCode('ABC123')
      expect(validation.valid).toBe(true)
      expect(validation.projectId).toBe('project_001')
    })

    it('should accept lowercase join code', () => {
      const { result } = renderHook(() => useProjectStore())

      const validation = result.current.validateJoinCode('abc123')
      expect(validation.valid).toBe(true)
      expect(validation.projectId).toBe('project_001')
    })

    it('should reject invalid format', () => {
      const { result } = renderHook(() => useProjectStore())

      const validation = result.current.validateJoinCode('ABC')
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('6 characters')
    })

    it('should reject special characters', () => {
      const { result } = renderHook(() => useProjectStore())

      const validation = result.current.validateJoinCode('ABC!@#')
      expect(validation.valid).toBe(false)
      expect(validation.error).toBeDefined()
    })

    it('should reject non-existent code', () => {
      const { result } = renderHook(() => useProjectStore())

      const validation = result.current.validateJoinCode('ZZZZZ9')
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('Invalid code')
    })

    it('should trim whitespace from code', () => {
      const { result } = renderHook(() => useProjectStore())

      const validation = result.current.validateJoinCode('  ABC123  ')
      expect(validation.valid).toBe(true)
    })
  })
})
