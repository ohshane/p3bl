import { createServerFn } from '@tanstack/react-start'
import { v4 as uuidv4 } from 'uuid'
import { eq, and, gt } from 'drizzle-orm'
import { db } from '@/db'
import { users, authSessions, passwordResets } from '@/db/schema'
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyRefreshToken,
  generateAccessToken,
  generatePasswordResetToken,
} from '@/server/auth'
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '@/server/validation/auth'

// Response types
export type AuthResponse = {
  success: true
  user: {
    id: string
    email: string
    name: string
    role: 'explorer' | 'creator' | 'admin' | 'pioneer'
    avatarUrl: string | null
    xp: number
    level: number
    defaultSessionDifficulty: 'easy' | 'medium' | 'hard'
  }
  accessToken: string
  refreshToken: string
  expiresAt: string
} | {
  success: false
  error: string
  errors?: Record<string, string[]>
}

// Helper to generate anonymized name
function generateAnonymizedName(): string {
  const adjectives = ['Swift', 'Bright', 'Calm', 'Eager', 'Bold', 'Wise', 'Kind']
  const nouns = ['Explorer', 'Pioneer', 'Scholar', 'Learner', 'Voyager', 'Seeker']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${adj}${noun}_${num}`
}

/**
 * Register a new user
 */
export const register = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const result = registerSchema.safeParse(data)
    if (!result.success) {
      throw new Error(JSON.stringify({
        error: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }))
    }
    return result.data
  })
  .handler(async ({ data }): Promise<AuthResponse> => {
    try {
      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase()),
      })

      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists',
        }
      }

      // Hash password
      const passwordHash = await hashPassword(data.password)

      // Create user
      const userId = uuidv4()
      const now = new Date()

      await db.insert(users).values({
        id: userId,
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        role: data.role,
        xp: 0,
        level: 1,
        anonymizedName: generateAnonymizedName(),
        createdAt: now,
        updatedAt: now,
      })

      // Generate tokens
      const tokenData = await generateTokenPair({
        userId,
        email: data.email.toLowerCase(),
        role: data.role,
      })

      // Store refresh token session
      await db.insert(authSessions).values({
        id: tokenData.sessionId,
        userId,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.refreshTokenExpiresAt,
        createdAt: now,
      })

      return {
        success: true,
        user: {
          id: userId,
          email: data.email.toLowerCase(),
          name: data.name,
          role: data.role,
          avatarUrl: null,
          xp: 0,
          level: 1,
          defaultSessionDifficulty: 'medium',
        },
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.accessTokenExpiresAt.toISOString(),
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      }
    }
  })

/**
 * Login user
 */
export const login = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const result = loginSchema.safeParse(data)
    if (!result.success) {
      throw new Error(JSON.stringify({
        error: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }))
    }
    return result.data
  })
  .handler(async ({ data }): Promise<AuthResponse> => {
    try {
      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase()),
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
        }
      }

      // Verify password
      const isValid = await verifyPassword(data.password, user.passwordHash)
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid email or password',
        }
      }

      // Generate tokens
      const tokenData = await generateTokenPair({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      // Store refresh token session
      await db.insert(authSessions).values({
        id: tokenData.sessionId,
        userId: user.id,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.refreshTokenExpiresAt,
        createdAt: new Date(),
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          xp: user.xp,
          level: user.level,
          defaultSessionDifficulty: user.defaultSessionDifficulty,
        },
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.accessTokenExpiresAt.toISOString(),
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Login failed. Please try again.',
      }
    }
  })

/**
 * Refresh access token
 */
export const refreshToken = createServerFn({ method: 'POST' })
  .inputValidator((data: { refreshToken: string }) => data)
  .handler(async ({ data }): Promise<AuthResponse> => {
    try {
      // Verify refresh token
      const payload = await verifyRefreshToken(data.refreshToken)
      if (!payload || !payload.sessionId) {
        return {
          success: false,
          error: 'Invalid refresh token',
        }
      }

      // Check if session exists and is valid
      const session = await db.query.authSessions.findFirst({
        where: and(
          eq(authSessions.id, payload.sessionId),
          eq(authSessions.refreshToken, data.refreshToken),
          gt(authSessions.expiresAt, new Date())
        ),
      })

      if (!session) {
        return {
          success: false,
          error: 'Session expired or invalid',
        }
      }

      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.sub!),
      })

      if (!user) {
        return {
          success: false,
          error: 'User not found',
        }
      }

      // Generate new access token
      const { token: accessToken, expiresAt } = await generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          xp: user.xp,
          level: user.level,
          defaultSessionDifficulty: user.defaultSessionDifficulty,
        },
        accessToken,
        refreshToken: data.refreshToken, // Return same refresh token
        expiresAt: expiresAt.toISOString(),
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      return {
        success: false,
        error: 'Failed to refresh token',
      }
    }
  })

/**
 * Logout user (invalidate session)
 */
export const logout = createServerFn({ method: 'POST' })
  .inputValidator((data: { refreshToken: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Delete the session
      await db.delete(authSessions)
        .where(eq(authSessions.refreshToken, data.refreshToken))

      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: 'Logout failed' }
    }
  })

/**
 * Logout all sessions for a user
 */
export const logoutAll = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    try {
      await db.delete(authSessions)
        .where(eq(authSessions.userId, data.userId))

      return { success: true }
    } catch (error) {
      console.error('Logout all error:', error)
      return { success: false, error: 'Failed to logout all sessions' }
    }
  })

/**
 * Request password reset
 */
export const requestPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const result = passwordResetRequestSchema.safeParse(data)
    if (!result.success) {
      throw new Error('Invalid email')
    }
    return result.data
  })
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    try {
      // Find user (don't reveal if user exists)
      const user = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase()),
      })

      // Always return success message to prevent email enumeration
      const successMessage = 'If an account exists with this email, you will receive a password reset link.'

      if (!user) {
        return { success: true, message: successMessage }
      }

      // Generate reset token
      const { token, expiresAt } = generatePasswordResetToken()

      // Store reset token
      await db.insert(passwordResets).values({
        id: uuidv4(),
        userId: user.id,
        token,
        expiresAt,
        createdAt: new Date(),
      })

      // In production, send email here
      // For now, log the token (DEV ONLY)
      console.log(`Password reset token for ${user.email}: ${token}`)

      return { success: true, message: successMessage }
    } catch (error) {
      console.error('Password reset request error:', error)
      return { success: false, message: 'Failed to process request' }
    }
  })

/**
 * Reset password with token
 */
export const resetPassword = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const result = passwordResetSchema.safeParse(data)
    if (!result.success) {
      throw new Error(JSON.stringify({
        error: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }))
    }
    return result.data
  })
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find valid reset token
      const resetRecord = await db.query.passwordResets.findFirst({
        where: and(
          eq(passwordResets.token, data.token),
          gt(passwordResets.expiresAt, new Date())
        ),
      })

      if (!resetRecord || resetRecord.usedAt) {
        return { success: false, error: 'Invalid or expired reset token' }
      }

      // Hash new password
      const passwordHash = await hashPassword(data.password)

      // Update user password
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetRecord.userId))

      // Mark token as used
      await db.update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.id, resetRecord.id))

      // Invalidate all user sessions (force re-login)
      await db.delete(authSessions)
        .where(eq(authSessions.userId, resetRecord.userId))

      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  })

/**
 * Get current user from token
 */
export const getCurrentUser = createServerFn({ method: 'GET' })
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data }) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          xp: user.xp,
          level: user.level,
          anonymizedName: user.anonymizedName,
          defaultSessionDifficulty: user.defaultSessionDifficulty,
          createdAt: user.createdAt.toISOString(),
        },
      }
    } catch (error) {
      console.error('Get current user error:', error)
      return { success: false, error: 'Failed to get user' }
    }
  })

/**
 * Update user profile
 */
export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; updates: unknown }) => {
    const result = updateProfileSchema.safeParse(data.updates)
    if (!result.success) {
      throw new Error(JSON.stringify({
        error: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }))
    }
    return { userId: data.userId, updates: result.data }
  })
  .handler(async ({ data }) => {
    try {
      await db.update(users)
        .set({
          ...data.updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, data.userId))

      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      })

      if (!updatedUser) {
        return { success: false, error: 'User not found' }
      }

      return {
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          avatarUrl: updatedUser.avatarUrl,
          xp: updatedUser.xp,
          level: updatedUser.level,
          defaultSessionDifficulty: updatedUser.defaultSessionDifficulty,
        },
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: 'Failed to update profile' }
    }
  })

/**
 * Change password (for authenticated users)
 */
export const changePassword = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; passwords: unknown }) => {
    const result = changePasswordSchema.safeParse(data.passwords)
    if (!result.success) {
      throw new Error(JSON.stringify({
        error: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }))
    }
    return { userId: data.userId, passwords: result.data }
  })
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, data.userId),
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Verify current password
      const isValid = await verifyPassword(data.passwords.currentPassword, user.passwordHash)
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Hash new password
      const passwordHash = await hashPassword(data.passwords.newPassword)

      // Update password
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, data.userId))

      return { success: true }
    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: 'Failed to change password' }
    }
  })
