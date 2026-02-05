import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken as apiRefreshToken, getCurrentUser } from '@/server/api/auth'
import type { CompetencyScores, Notification } from '@/types'

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
  name: string
  role: 'explorer' | 'creator' | 'admin' | 'pioneer'
  avatarUrl: string | null
  xp: number
  level: number
  hallOfFameOptIn?: boolean
  anonymizedName?: string
  createdAt?: string
  earnedBadgeIds: string[]
  competencies: CompetencyScores
  joinedProjectIds: string[]
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'p3bl_access_token'
const REFRESH_TOKEN_KEY = 'p3bl_refresh_token'
const TOKEN_EXPIRY_KEY = 'p3bl_token_expiry'

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
  register: (data: { email: string; password: string; name: string }) => Promise<{ success: boolean; error?: string }>
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
          // Support short usernames - treat them as username@p3bl.local
          const shortUsernames = ['admin', 'creator1', 'creator2', 'creator3', 'explorer1', 'explorer2', 'explorer3']
          const email = shortUsernames.includes(emailOrUsername.toLowerCase())
            ? `${emailOrUsername.toLowerCase()}@p3bl.local`
            : emailOrUsername.toLowerCase()
          
          const result = await apiLogin({ data: { email, password } })
          
          if (result.success) {
            const user: AuthUser = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl,
              xp: result.user.xp,
              level: result.user.level,
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
              password: data.password,
              name: data.name,
              role: 'explorer', // Self-registration is always as explorer
            }
          })
          
          if (result.success) {
            const user: AuthUser = {
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              role: result.user.role,
              avatarUrl: result.user.avatarUrl,
              xp: result.user.xp,
              level: result.user.level,
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
                name: result.user.name,
                role: result.user.role,
                avatarUrl: result.user.avatarUrl,
                xp: result.user.xp,
                level: result.user.level,
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
        
        // Don't add if already joined
        if (currentUser.joinedProjectIds.includes(projectId)) return
        
        set({
          currentUser: {
            ...currentUser,
            joinedProjectIds: [...currentUser.joinedProjectIds, projectId],
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
    }
  )
)

// Selector hooks for convenience
export const useCurrentUser = () => useAuthStore((state) => state.currentUser)
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)
export const useIsAdmin = () => useAuthStore((state) => state.currentUser?.role === 'admin')
export const useIsCreator = () => useAuthStore((state) => state.currentUser?.role === 'creator' || state.currentUser?.role === 'admin')
export const useIsPioneer = () => useAuthStore((state) => state.currentUser?.role === 'pioneer')
export const useUserRole = () => useAuthStore((state) => state.currentUser?.role)
