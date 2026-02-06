import { createServerFn } from '@tanstack/react-start'
import { v4 as uuidv4 } from 'uuid'
import { eq, like, or, desc, asc, sql, gte } from 'drizzle-orm'
import { db } from '@/db'
import { users, systemSettings, SETTING_KEYS, DEFAULT_SETTINGS, type SettingKey } from '@/db/schema'
import { hashPassword } from '@/server/auth'
import { z } from 'zod'
import type { UserRole } from '@/db/schema/users'

// Validation schemas
const listUsersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['explorer', 'creator', 'pioneer', 'admin']).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['explorer', 'creator', 'pioneer', 'admin']),
})

const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['explorer', 'creator', 'pioneer', 'admin']),
})

const deleteUserSchema = z.object({
  userId: z.string(),
})

// Helper to generate anonymized name
function generateAnonymizedName(): string {
  const adjectives = ['Swift', 'Bright', 'Calm', 'Eager', 'Bold', 'Wise', 'Kind']
  const nouns = ['Explorer', 'Pioneer', 'Scholar', 'Learner', 'Voyager', 'Seeker']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${adj}${noun}_${num}`
}

// Response types
export type UserListItem = {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl: string | null
  xp: number
  level: number
  createdAt: string
}

export type ListUsersResponse = {
  success: true
  users: UserListItem[]
  total: number
  page: number
  limit: number
  totalPages: number
} | {
  success: false
  error: string
}

export type AdminActionResponse = {
  success: true
  user?: UserListItem
  message?: string
} | {
  success: false
  error: string
}

/**
 * List all users (admin only)
 */
export const listUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => {
    return listUsersSchema.parse(data)
  })
  .handler(async ({ data }): Promise<ListUsersResponse> => {
    try {
      const { page, limit, search, role, sortBy, sortOrder } = data
      const offset = (page - 1) * limit

      // Build where conditions
      let whereConditions = []
      
      if (search) {
        const searchPattern = `%${search}%`
        whereConditions.push(
          or(
            like(users.name, searchPattern),
            like(users.email, searchPattern)
          )
        )
      }
      
      if (role) {
        whereConditions.push(eq(users.role, role))
      }

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereConditions.length > 0 ? whereConditions[0] : undefined)

      const total = Number(countResult[0]?.count || 0)
      const totalPages = Math.ceil(total / limit)

      // Build sort
      const sortColumn = sortBy === 'name' ? users.name
        : sortBy === 'email' ? users.email
        : sortBy === 'role' ? users.role
        : users.createdAt

      const orderFn = sortOrder === 'asc' ? asc : desc

      // Get users
      let query = db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          avatarUrl: users.avatarUrl,
          xp: users.xp,
          level: users.level,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset)

      if (whereConditions.length > 0) {
        query = query.where(whereConditions[0]) as typeof query
      }

      const userResults = await query

      return {
        success: true,
        users: userResults.map(u => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages,
      }
    } catch (error) {
      console.error('List users error:', error)
      return { success: false, error: 'Failed to list users' }
    }
  })

/**
 * Create a new user (admin only)
 */
export const createUser = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    const result = createUserSchema.safeParse(data)
    if (!result.success) {
      throw new Error(JSON.stringify({
        error: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      }))
    }
    return result.data
  })
  .handler(async ({ data }): Promise<AdminActionResponse> => {
    try {
      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email.toLowerCase()),
      })

      if (existingUser) {
        return {
          success: false,
          error: 'A user with this email already exists',
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
          createdAt: now.toISOString(),
        },
        message: `User ${data.name} created successfully`,
      }
    } catch (error) {
      console.error('Create user error:', error)
      return { success: false, error: 'Failed to create user' }
    }
  })

/**
 * Update user role (admin only)
 */
export const updateUserRole = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return updateUserRoleSchema.parse(data)
  })
  .handler(async ({ data }): Promise<AdminActionResponse> => {
    try {
      const { userId, role } = data

      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Don't allow changing the last admin's role
      if (user.role === 'admin' && role !== 'admin') {
        const adminCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.role, 'admin'))
        
        if (Number(adminCount[0]?.count || 0) <= 1) {
          return { success: false, error: 'Cannot change role of the last admin' }
        }
      }

      // Update role
      await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId))

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          avatarUrl: user.avatarUrl,
          xp: user.xp,
          level: user.level,
          createdAt: user.createdAt.toISOString(),
        },
        message: `User role updated to ${role}`,
      }
    } catch (error) {
      console.error('Update user role error:', error)
      return { success: false, error: 'Failed to update user role' }
    }
  })

/**
 * Delete user (admin only)
 */
export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    return deleteUserSchema.parse(data)
  })
  .handler(async ({ data }): Promise<AdminActionResponse> => {
    try {
      const { userId } = data

      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Don't allow deleting the last admin
      if (user.role === 'admin') {
        const adminCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.role, 'admin'))
        
        if (Number(adminCount[0]?.count || 0) <= 1) {
          return { success: false, error: 'Cannot delete the last admin' }
        }
      }

      // Delete user (cascade will handle related records)
      await db.delete(users).where(eq(users.id, userId))

      return {
        success: true,
        message: `User ${user.name} deleted successfully`,
      }
    } catch (error) {
      console.error('Delete user error:', error)
      return { success: false, error: 'Failed to delete user' }
    }
  })

/**
 * Get user details (admin only)
 */
export const getUserDetails = createServerFn({ method: 'GET' })
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
          hallOfFameOptIn: user.hallOfFameOptIn,
          anonymizedName: user.anonymizedName,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      }
    } catch (error) {
      console.error('Get user details error:', error)
      return { success: false, error: 'Failed to get user details' }
    }
  })

/**
 * Reset user password (admin only)
 */
export const resetUserPassword = createServerFn({ method: 'POST' })
  .inputValidator((data: { userId: string; newPassword: string }) => {
    if (data.newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }
    return data
  })
  .handler(async ({ data }): Promise<AdminActionResponse> => {
    try {
      const { userId, newPassword } = data

      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword)

      // Update password
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId))

      return {
        success: true,
        message: `Password reset for ${user.name}`,
      }
    } catch (error) {
      console.error('Reset user password error:', error)
      return { success: false, error: 'Failed to reset password' }
    }
  })

/**
 * Get admin dashboard stats
 */
export const getAdminStats = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const [totalUsers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)

      const [explorers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'explorer'))

      const [creators] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'creator'))

      const [pioneers] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'pioneer'))

      const [admins] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.role, 'admin'))

      // Get recent users (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const recentUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(gte(users.createdAt, sevenDaysAgo))
        .orderBy(desc(users.createdAt))
        .limit(5)

      return {
        success: true,
        stats: {
          totalUsers: Number(totalUsers.count),
          explorers: Number(explorers.count),
          creators: Number(creators.count),
          pioneers: Number(pioneers.count),
          admins: Number(admins.count),
        },
        recentUsers: recentUsers.map(u => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        })),
      }
    } catch (error) {
      console.error('Get admin stats error:', error)
      return { success: false, error: 'Failed to get stats' }
    }
  })

// ==================== SYSTEM SETTINGS ====================

export type SystemSettingItem = {
  key: string
  value: string
  description: string | null
  updatedAt: string
}

export type GetSettingsResponse = {
  success: true
  settings: SystemSettingItem[]
} | {
  success: false
  error: string
}

export type UpdateSettingResponse = {
  success: true
  setting: SystemSettingItem
} | {
  success: false
  error: string
}

/**
 * Get all system settings (admin only)
 */
export const getSystemSettings = createServerFn({ method: 'GET' })
  .handler(async (): Promise<GetSettingsResponse> => {
    try {
      // Get all settings from database
      const dbSettings = await db.select().from(systemSettings)
      
      // Create a map of existing settings
      const settingsMap = new Map(dbSettings.map(s => [s.key, s]))
      
      // Merge with defaults to ensure all settings exist
      const allSettings: SystemSettingItem[] = Object.entries(SETTING_KEYS).map(([, key]) => {
        const dbSetting = settingsMap.get(key)
        if (dbSetting) {
          return {
            key: dbSetting.key,
            value: dbSetting.value,
            description: dbSetting.description,
            updatedAt: dbSetting.updatedAt.toISOString(),
          }
        }
        // Return default if not in database
        return {
          key,
          value: DEFAULT_SETTINGS[key as SettingKey],
          description: null,
          updatedAt: new Date().toISOString(),
        }
      })

      return {
        success: true,
        settings: allSettings,
      }
    } catch (error) {
      console.error('Get system settings error:', error)
      // Return defaults on error (e.g., table doesn't exist yet)
      const defaultSettings: SystemSettingItem[] = Object.entries(SETTING_KEYS).map(([, key]) => ({
        key,
        value: DEFAULT_SETTINGS[key as SettingKey],
        description: null,
        updatedAt: new Date().toISOString(),
      }))
      return {
        success: true,
        settings: defaultSettings,
      }
    }
  })

/**
 * Get a single system setting by key
 */
export const getSystemSetting = createServerFn({ method: 'GET' })
  .inputValidator((data: { key: string }) => data)
  .handler(async ({ data }): Promise<{ success: true; value: string } | { success: false; error: string }> => {
    try {
      const setting = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, data.key),
      })

      if (setting) {
        return { success: true, value: setting.value }
      }

      // Return default if not in database
      const defaultValue = DEFAULT_SETTINGS[data.key as SettingKey]
      if (defaultValue) {
        return { success: true, value: defaultValue }
      }

      return { success: false, error: 'Setting not found' }
    } catch (error) {
      console.error('Get system setting error:', error)
      return { success: false, error: 'Failed to get setting' }
    }
  })

/**
 * Update a system setting (admin only)
 */
export const updateSystemSetting = createServerFn({ method: 'POST' })
  .inputValidator((data: { key: string; value: string; updatedBy?: string }) => {
    if (!data.key || typeof data.value !== 'string') {
      throw new Error('Invalid setting data')
    }
    return data
  })
  .handler(async ({ data }): Promise<UpdateSettingResponse> => {
    try {
      const { key, value, updatedBy } = data
      const now = new Date()

      // Check if setting exists
      const existing = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.key, key),
      })

      if (existing) {
        // Update existing
        await db.update(systemSettings)
          .set({ value, updatedAt: now, updatedBy })
          .where(eq(systemSettings.key, key))
      } else {
        // Insert new
        await db.insert(systemSettings).values({
          id: uuidv4(),
          key,
          value,
          updatedAt: now,
          updatedBy,
        })
      }

      return {
        success: true,
        setting: {
          key,
          value,
          description: existing?.description || null,
          updatedAt: now.toISOString(),
        },
      }
    } catch (error) {
      console.error('Update system setting error:', error)
      return { success: false, error: 'Failed to update setting' }
    }
  })

/**
 * Get AI model setting - convenience function for use across the app
 */
export const getAIModel = createServerFn({ method: 'GET' })
  .handler(async (): Promise<{ success: true; model: string } | { success: false; error: string }> => {
    try {
      // Use select instead of query.findFirst for simpler query
      const settings = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, SETTING_KEYS.AI_MODEL))
        .limit(1)

      const setting = settings[0]

      return {
        success: true,
        model: setting?.value || DEFAULT_SETTINGS[SETTING_KEYS.AI_MODEL],
      }
    } catch (error) {
      console.error('Get AI model error:', error)
      // Return default on error instead of failing
      return {
        success: true,
        model: DEFAULT_SETTINGS[SETTING_KEYS.AI_MODEL],
      }
    }
  })
