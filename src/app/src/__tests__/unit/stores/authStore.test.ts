/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'
import { act, renderHook } from '@testing-library/react'
import type { User, Notification, ProjectInvitation } from '@/types'

// Create mock data
const mockUsers: User[] = [
  {
    id: 'user_001',
    name: 'Test Explorer',
    email: 'explorer@test.com',
    role: 'explorer',
    xp: 100,
    level: 2,
    earnedBadgeIds: ['badge_1'],
    joinedProjectIds: ['project_001'],
    pendingInvitations: [
      { id: 'inv_1', projectId: 'project_002', projectTitle: 'Test Project', status: 'pending' } as ProjectInvitation
    ],
    competencies: {
      critical_thinking: { current: 60, baseline: 50 },
      communication: { current: 70, baseline: 60 },
      collaboration: { current: 55, baseline: 45 },
      creativity: { current: 65, baseline: 55 },
      problem_solving: { current: 75, baseline: 65 },
    },
  } as User,
  {
    id: 'user_002',
    name: 'Test Creator',
    email: 'creator@test.com',
    role: 'creator',
    xp: 500,
    level: 4,
    earnedBadgeIds: [],
    joinedProjectIds: [],
    pendingInvitations: [],
    competencies: {},
  } as User,
]

const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'new_feedback',
    title: 'Test Notification',
    message: 'This is a test notification',
    read: false,
    projectId: 'project_001',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'notif_2',
    type: 'badge_earned',
    title: 'Badge Earned',
    message: 'You earned a badge!',
    read: true,
    projectId: null,
    createdAt: '2024-01-02T00:00:00Z',
  },
]

// Create a test version of the auth store without persistence
interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  availableUsers: User[]
  notifications: Notification[]
  unreadNotificationCount: number
  login: (userId: string) => void
  logout: () => void
  switchUser: (userId: string) => void
  acceptInvitation: (invitationId: string) => void
  dismissInvitation: (invitationId: string) => void
  addInvitation: (invitation: ProjectInvitation) => void
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  addXP: (amount: number) => void
  addBadge: (badgeId: string, context: string) => void
  updateCompetencies: (competencies: User['competencies']) => void
}

const createTestAuthStore = () => create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  availableUsers: mockUsers,
  notifications: [...mockNotifications],
  unreadNotificationCount: mockNotifications.filter(n => !n.read).length,
  
  login: (userId: string) => {
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      set({
        currentUser: { ...user },
        isAuthenticated: true,
      })
    }
  },
  
  logout: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
    })
  },
  
  switchUser: (userId: string) => {
    const user = mockUsers.find(u => u.id === userId)
    if (user) {
      set({
        currentUser: { ...user },
        isAuthenticated: true,
        notifications: [...mockNotifications],
        unreadNotificationCount: mockNotifications.filter(n => !n.read).length,
      })
    }
  },
  
  acceptInvitation: (invitationId: string) => {
    const { currentUser } = get()
    if (!currentUser) return
    
    const invitation = currentUser.pendingInvitations.find(i => i.id === invitationId)
    if (!invitation) return
    
    set({
      currentUser: {
        ...currentUser,
        pendingInvitations: currentUser.pendingInvitations.filter(i => i.id !== invitationId),
        joinedProjectIds: [...currentUser.joinedProjectIds, invitation.projectId],
      },
    })
  },
  
  dismissInvitation: (invitationId: string) => {
    const { currentUser } = get()
    if (!currentUser) return
    
    set({
      currentUser: {
        ...currentUser,
        pendingInvitations: currentUser.pendingInvitations.filter(i => i.id !== invitationId),
      },
    })
  },
  
  addInvitation: (invitation: ProjectInvitation) => {
    const { currentUser } = get()
    if (!currentUser) return
    
    set({
      currentUser: {
        ...currentUser,
        pendingInvitations: [...currentUser.pendingInvitations, invitation],
      },
    })
  },
  
  markNotificationRead: (notificationId: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadNotificationCount: state.notifications.filter(n => !n.read && n.id !== notificationId).length,
    }))
  },
  
  markAllNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadNotificationCount: 0,
    }))
  },
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadNotificationCount: state.unreadNotificationCount + 1,
    }))
  },
  
  addXP: (amount: number) => {
    const { currentUser, addNotification } = get()
    if (!currentUser) return
    
    const newXP = currentUser.xp + amount
    
    const LEVELS = [
      { level: 1, name: 'Newcomer', xpRequired: 0 },
      { level: 2, name: 'Learner', xpRequired: 100 },
      { level: 3, name: 'Explorer', xpRequired: 300 },
      { level: 4, name: 'Navigator', xpRequired: 600 },
      { level: 5, name: 'Pioneer', xpRequired: 1000 },
      { level: 6, name: 'Master', xpRequired: 1500 },
    ]
    
    const nextLevelDef = LEVELS.find(l => l.level === currentUser.level + 1)
    
    let newLevel = currentUser.level
    if (nextLevelDef && newXP >= nextLevelDef.xpRequired) {
      newLevel = nextLevelDef.level
      addNotification({
        type: 'level_up',
        title: 'Level Up!',
        message: `Congratulations! You've reached Level ${newLevel} - ${nextLevelDef.name}`,
        projectId: null,
        read: false,
        actionUrl: '/portfolio/achievements',
      })
    }
    
    set({
      currentUser: {
        ...currentUser,
        xp: newXP,
        level: newLevel,
      },
    })
  },
  
  addBadge: (badgeId: string, _context: string) => {
    const { currentUser, addNotification, addXP } = get()
    if (!currentUser) return
    if (currentUser.earnedBadgeIds.includes(badgeId)) return
    
    set({
      currentUser: {
        ...currentUser,
        earnedBadgeIds: [...currentUser.earnedBadgeIds, badgeId],
      },
    })
    
    addNotification({
      type: 'badge_earned',
      title: 'Badge Earned!',
      message: `You earned a new badge: ${badgeId}`,
      projectId: null,
      read: false,
      actionUrl: '/portfolio/achievements',
    })
    
    addXP(15)
  },
  
  updateCompetencies: (competencies: User['competencies']) => {
    const { currentUser } = get()
    if (!currentUser) return
    
    set({
      currentUser: {
        ...currentUser,
        competencies,
      },
    })
  },
}))

// Store instance for tests
let useAuthStore: ReturnType<typeof createTestAuthStore>

describe('Auth Store', () => {
  beforeEach(() => {
    // Create fresh store for each test
    useAuthStore = createTestAuthStore()
  })

  describe('Authentication', () => {
    it('should start with no authenticated user', () => {
      const { result } = renderHook(() => useAuthStore())

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should login a user successfully', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      expect(result.current.currentUser).not.toBeNull()
      expect(result.current.currentUser?.id).toBe('user_001')
      expect(result.current.currentUser?.name).toBe('Test Explorer')
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should not login with invalid user ID', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('invalid_user')
      })

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should logout successfully', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      expect(result.current.isAuthenticated).toBe(true)

      act(() => {
        result.current.logout()
      })

      expect(result.current.currentUser).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should switch users successfully', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      expect(result.current.currentUser?.id).toBe('user_001')

      act(() => {
        result.current.switchUser('user_002')
      })

      expect(result.current.currentUser?.id).toBe('user_002')
      expect(result.current.currentUser?.name).toBe('Test Creator')
      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('Invitations', () => {
    it('should accept an invitation', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const initialInvitations = result.current.currentUser?.pendingInvitations.length

      act(() => {
        result.current.acceptInvitation('inv_1')
      })

      expect(result.current.currentUser?.pendingInvitations.length).toBe((initialInvitations ?? 1) - 1)
      expect(result.current.currentUser?.joinedProjectIds).toContain('project_002')
    })

    it('should dismiss an invitation', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const initialInvitations = result.current.currentUser?.pendingInvitations.length

      act(() => {
        result.current.dismissInvitation('inv_1')
      })

      expect(result.current.currentUser?.pendingInvitations.length).toBe((initialInvitations ?? 1) - 1)
      expect(result.current.currentUser?.joinedProjectIds).not.toContain('project_002')
    })

    it('should add a new invitation', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const initialCount = result.current.currentUser?.pendingInvitations.length

      act(() => {
        result.current.addInvitation({
          id: 'inv_new',
          projectId: 'project_003',
          projectTitle: 'New Project',
          status: 'pending',
        } as ProjectInvitation)
      })

      expect(result.current.currentUser?.pendingInvitations.length).toBe((initialCount ?? 0) + 1)
    })

    it('should not modify invitations when no user is logged in', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.acceptInvitation('inv_1')
      })

      expect(result.current.currentUser).toBeNull()
    })
  })

  describe('Notifications', () => {
    it('should mark a notification as read', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.markNotificationRead('notif_1')
      })

      const notification = result.current.notifications.find(n => n.id === 'notif_1')
      expect(notification?.read).toBe(true)
      expect(result.current.unreadNotificationCount).toBe(0)
    })

    it('should mark all notifications as read', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.markAllNotificationsRead()
      })

      expect(result.current.notifications.every(n => n.read)).toBe(true)
      expect(result.current.unreadNotificationCount).toBe(0)
    })

    it('should add a new notification', () => {
      const { result } = renderHook(() => useAuthStore())

      const initialCount = result.current.notifications.length

      act(() => {
        result.current.addNotification({
          type: 'session_unlocked',
          title: 'New Session',
          message: 'Session 2 is now available',
          projectId: 'project_001',
          read: false,
        })
      })

      expect(result.current.notifications.length).toBe(initialCount + 1)
      expect(result.current.notifications[0].type).toBe('session_unlocked')
      expect(result.current.unreadNotificationCount).toBe(2)
    })
  })

  describe('XP and Leveling', () => {
    it('should add XP to the current user', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const initialXP = result.current.currentUser?.xp ?? 0

      act(() => {
        result.current.addXP(50)
      })

      expect(result.current.currentUser?.xp).toBe(initialXP + 50)
    })

    it('should level up when XP threshold is reached', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      // User is at level 2, needs 300 XP for level 3
      // Current XP is 100, add 200 to reach level 3
      act(() => {
        result.current.addXP(200)
      })

      expect(result.current.currentUser?.level).toBe(3)
    })

    it('should create level up notification', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const initialNotifCount = result.current.notifications.length

      act(() => {
        result.current.addXP(200) // Level up from 2 to 3
      })

      expect(result.current.notifications.length).toBeGreaterThan(initialNotifCount)
      expect(result.current.notifications.find(n => n.type === 'level_up')).toBeDefined()
    })

    it('should not add XP when no user is logged in', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.addXP(100)
      })

      expect(result.current.currentUser).toBeNull()
    })
  })

  describe('Badges', () => {
    it('should add a badge to the current user', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      act(() => {
        result.current.addBadge('badge_new', 'Test context')
      })

      expect(result.current.currentUser?.earnedBadgeIds).toContain('badge_new')
    })

    it('should not add duplicate badges', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const initialBadgeCount = result.current.currentUser?.earnedBadgeIds.length ?? 0

      act(() => {
        result.current.addBadge('badge_1', 'Context') // Already has this badge
      })

      expect(result.current.currentUser?.earnedBadgeIds.length).toBe(initialBadgeCount)
    })

    it('should create badge earned notification', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      act(() => {
        result.current.addBadge('badge_new', 'Context')
      })

      expect(result.current.notifications.find(n => n.type === 'badge_earned' && n.message.includes('badge_new'))).toBeDefined()
    })

    it('should add XP when earning a badge', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const initialXP = result.current.currentUser?.xp ?? 0

      act(() => {
        result.current.addBadge('badge_new', 'Context')
      })

      expect(result.current.currentUser?.xp).toBe(initialXP + 15)
    })
  })

  describe('Competencies', () => {
    it('should update user competencies', () => {
      const { result } = renderHook(() => useAuthStore())

      act(() => {
        result.current.login('user_001')
      })

      const newCompetencies = {
        critical_thinking: { current: 80, baseline: 50 },
        communication: { current: 85, baseline: 60 },
        collaboration: { current: 70, baseline: 45 },
        creativity: { current: 75, baseline: 55 },
        problem_solving: { current: 90, baseline: 65 },
      }

      act(() => {
        result.current.updateCompetencies(newCompetencies)
      })

      expect(result.current.currentUser?.competencies.critical_thinking.current).toBe(80)
      expect(result.current.currentUser?.competencies.problem_solving.current).toBe(90)
    })
  })
})
