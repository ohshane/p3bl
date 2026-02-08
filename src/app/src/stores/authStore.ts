import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken as apiRefreshToken } from '@/server/api/auth'
import type { CompetencyScores, Notification, SessionDifficulty, UserRole } from '@/types'

// Default competencies for new users
const DEFAULT_COMPETENCIES: CompetencyScores = {
  criticalThinking: { current: 50, baseline: null, lastUpdated: new Date().toISOString(), insight: 'No assessments yet' },
  communication: { current: 50, baseline: null, lastUpdated: new Date().toISOString(), insight: 'No assessments yet' },
  collaboration: { current: 50, baseline: null, lastUpdated: new Date().toISOString(), insight: 'No assessments yet' },
  creativity: { current: 50, baseline: null, lastUpdated: new Date().toISOString(), insight: 'No assessments yet' },
  problemSolving: { current: 50, baseline: null, lastUpdated: new Date().toISOString(), insight: 'No assessments yet' },
}

// User type for the store
export interface AuthUser {
  id: string
  email: string
  username: string
  name: string
  role: UserRole[]
  avatarUrl: string | null
  xp: number
  level: number
  defaultSessionDifficulty?: SessionDifficulty
  anonymizedName?: string
  createdAt?: string
  earnedBadgeIds: string[]
  competencies: CompetencyScores
  joinedProjectIds: string[]
}

interface AuthState {
  // Current user
  currentUser: AuthUser | null
  isAuthenticated: boolean
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Notifications
  notifications: Notification[]
  unreadNotificationCount: number
  
  // Token management
  accessToken: string | null
  refreshToken: string | null
  tokenExpiresAt: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: { email: string; username: string; password: string; name: string }) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  clearError: () => void
  addXP: (amount: number) => void
  addJoinedProject: (projectId: string) => void
  
  // Notification actions
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  setNotifications: (notifications: Notification[]) => void
  
  // Token management
  refreshAccessToken: () => Promise<boolean>
  getAccessToken: () => Promise<string | null>
  
  // Check and restore session
  checkAuth: () => Promise<boolean>
  
  // Internal setters
  setUser: (user: AuthUser | null) => void
  setTokens: (accessToken: string, refreshToken: string, expiresAt: string) => void
  clearTokens: () => void
}

// Helper to check if token is expired or about to expire (within 1 minute)
function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  const expiry = new Date(expiresAt).getTime()
  const now = Date.now()
  const bufferMs = 60 * 1000 // 1 minute buffer
  return now >= expiry - bufferMs
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      notifications: [],
      unreadNotificationCount: 0,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      
      login: async (emailOrUsername: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await apiLogin({ data: { emailOrUsername, password } })
          
          if (result.success) {
            const user: AuthUser = {
              id: result.user.id,
              email: result.user.email,
              username: result.user.username,
              name: result.user.name,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl,
              xp: result.user.xp,
              level: result.user.level,
              defaultSessionDifficulty: (result.user as { defaultSessionDifficulty?: SessionDifficulty }).defaultSessionDifficulty,
              earnedBadgeIds: (result.user as { earnedBadgeIds?: string[] }).earnedBadgeIds ?? [],
              competencies: (result.user as { competencies?: CompetencyScores }).competencies ?? DEFAULT_COMPETENCIES,
              joinedProjectIds: (result.user as { joinedProjectIds?: string[] }).joinedProjectIds ?? [],
            }
            
            set({
              currentUser: user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              tokenExpiresAt: result.expiresAt,
            })
            
            return { success: true }
          } else {
            set({
              isLoading: false,
              error: result.error,
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed'
          set({
            isLoading: false,
            error: errorMessage,
          })
          return { success: false, error: errorMessage }
        }
      },
      
      register: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await apiRegister({
            data: {
              email: data.email.toLowerCase(),
              username: data.username,
              password: data.password,
              name: data.name,
              role: ['explorer'], // Self-registration is always as explorer
            }
          })
          
          if (result.success) {
            const user: AuthUser = {
              id: result.user.id,
              email: result.user.email,
              username: result.user.username,
              name: result.user.name,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl,
              xp: result.user.xp,
              level: result.user.level,
              defaultSessionDifficulty: (result.user as { defaultSessionDifficulty?: SessionDifficulty }).defaultSessionDifficulty,
              earnedBadgeIds: (result.user as { earnedBadgeIds?: string[] }).earnedBadgeIds ?? [],
              competencies: (result.user as { competencies?: CompetencyScores }).competencies ?? DEFAULT_COMPETENCIES,
              joinedProjectIds: (result.user as { joinedProjectIds?: string[] }).joinedProjectIds ?? [],
            }
            
            set({
              currentUser: user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              tokenExpiresAt: result.expiresAt,
            })
            
            return { success: true }
          } else {
            set({
              isLoading: false,
              error: result.error,
            })
            return { success: false, error: result.error }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed'
          set({
            isLoading: false,
            error: errorMessage,
          })
          return { success: false, error: errorMessage }
        }
      },
      
      logout: async () => {
        const { refreshToken } = get()
        
        try {
          if (refreshToken) {
            await apiLogout({ data: { refreshToken } })
          }
        } catch (error) {
          console.error('Logout API error:', error)
        }
        
        // Always clear local state
        set({
          currentUser: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
        })
      },
      
      clearError: () => {
        set({ error: null })
      },
      
      addXP: (amount: number) => {
        const { currentUser } = get()
        if (!currentUser) return
        
        const newXP = currentUser.xp + amount
        // Simple level calculation: level up every 100 XP
        const newLevel = Math.floor(newXP / 100) + 1
        
        set({
          currentUser: {
            ...currentUser,
            xp: newXP,
            level: Math.min(newLevel, 6), // Cap at level 6
          },
        })
      },
      
      refreshAccessToken: async () => {
        const { refreshToken } = get()
        
        if (!refreshToken) {
          return false
        }
        
        try {
          const result = await apiRefreshToken({ data: { refreshToken } })
          
          if (result.success) {
            set({
              currentUser: {
                id: result.user.id,
                email: result.user.email,
                username: result.user.username,
                name: result.user.name,
                role: result.user.role,
                avatarUrl: result.user.avatarUrl,
                xp: result.user.xp,
                level: result.user.level,
                defaultSessionDifficulty: (result.user as { defaultSessionDifficulty?: SessionDifficulty }).defaultSessionDifficulty,
                earnedBadgeIds: (result.user as { earnedBadgeIds?: string[] }).earnedBadgeIds ?? [],
                competencies: (result.user as { competencies?: CompetencyScores }).competencies ?? DEFAULT_COMPETENCIES,
                joinedProjectIds: (result.user as { joinedProjectIds?: string[] }).joinedProjectIds ?? [],
              },
              isAuthenticated: true,
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              tokenExpiresAt: result.expiresAt,
            })
            return true
          }
        } catch (error) {
          console.error('Token refresh error:', error)
        }
        
        // If refresh fails, clear auth state
        set({
          currentUser: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          tokenExpiresAt: null,
        })
        return false
      },
      
      getAccessToken: async () => {
        const { accessToken, tokenExpiresAt, refreshAccessToken } = get()
        
        // If token is expired or about to expire, try to refresh
        if (isTokenExpired(tokenExpiresAt)) {
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            return null
          }
          return get().accessToken
        }
        
        return accessToken
      },
      
      checkAuth: async () => {
        const { accessToken, refreshToken, tokenExpiresAt, refreshAccessToken } = get()
        
        // No tokens stored
        if (!refreshToken) {
          set({ isAuthenticated: false, currentUser: null })
          return false
        }
        
        // If access token is valid, we're good
        if (accessToken && !isTokenExpired(tokenExpiresAt)) {
          // Optionally fetch fresh user data
          return true
        }
        
        // Try to refresh the token
        return await refreshAccessToken()
      },
      
      setUser: (user) => {
        set({ currentUser: user, isAuthenticated: !!user })
      },
      
      setTokens: (accessToken, refreshToken, expiresAt) => {
        set({ accessToken, refreshToken, tokenExpiresAt: expiresAt })
      },
      
      clearTokens: () => {
        set({ accessToken: null, refreshToken: null, tokenExpiresAt: null })
      },
      
      addJoinedProject: (projectId: string) => {
        const { currentUser } = get()
        if (!currentUser) return
        
        const existing = currentUser.joinedProjectIds ?? []
        
        // Don't add if already joined
        if (existing.includes(projectId)) return
        
        set({
          currentUser: {
            ...currentUser,
            joinedProjectIds: [...existing, projectId],
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
      
      setNotifications: (notifications: Notification[]) => {
        set({
          notifications,
          unreadNotificationCount: notifications.filter(n => !n.read).length,
        })
      },
    }),
    {
      name: 'p3bl-auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
      merge: (persisted, current) => {
        const state = { ...current, ...(persisted as Partial<AuthState>) }
        // Ensure array fields on currentUser are never undefined from stale storage
        if (state.currentUser) {
          state.currentUser = {
            ...state.currentUser,
            joinedProjectIds: state.currentUser.joinedProjectIds ?? [],
            earnedBadgeIds: state.currentUser.earnedBadgeIds ?? [],
            competencies: state.currentUser.competencies ?? DEFAULT_COMPETENCIES,
          }
        }
        return state
      },
    }
  )
)

// Selector hooks for convenience
export const useCurrentUser = () => useAuthStore((state) => state.currentUser)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsAdmin = () => useAuthStore((state) => state.currentUser?.role?.includes('admin') ?? false)
export const useIsCreator = () => useAuthStore((state) => state.currentUser?.role?.includes('creator') ?? false)
export const useUserRoles = () => useAuthStore((state) => state.currentUser?.role ?? [])
export const useHasRole = (role: UserRole) => useAuthStore((state) => state.currentUser?.role?.includes(role) ?? false)
