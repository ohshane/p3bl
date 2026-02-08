import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export type SessionDifficultyPreference = 'easy' | 'medium' | 'hard'

// User roles - base roles that can be combined
export type UserRole = 'explorer' | 'creator' | 'admin'

// All valid roles
export const ALL_ROLES: UserRole[] = ['admin', 'creator', 'explorer']

// Default roles for new self-registered users
export const DEFAULT_ROLES: UserRole[] = ['explorer']

// Parse roles from JSON string stored in database
export function parseRoles(rolesJson: string | null): UserRole[] {
  if (!rolesJson) return [...DEFAULT_ROLES]
  try {
    const parsed = JSON.parse(rolesJson)
    if (Array.isArray(parsed)) {
      return parsed.filter((r: string) => ALL_ROLES.includes(r as UserRole)) as UserRole[]
    }
  } catch {
    // Handle legacy single-string role values
    if (ALL_ROLES.includes(rolesJson as UserRole)) {
      return [rolesJson as UserRole]
    }
  }
  return [...DEFAULT_ROLES]
}

// Serialize roles array to JSON string for database storage
export function serializeRoles(roles: UserRole[]): string {
  return JSON.stringify(roles)
}

// Check if a roles array includes a specific role
export function hasRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role)
}

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role').notNull().default('["explorer"]'),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  anonymizedName: text('anonymized_name'),
  defaultSessionDifficulty: text('default_session_difficulty')
    .$type<SessionDifficultyPreference>()
    .notNull()
    .default('medium'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Auth sessions for JWT refresh tokens
export const authSessions = sqliteTable('auth_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Password reset tokens
export const passwordResets = sqliteTable('password_resets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  authSessions: many(authSessions),
  passwordResets: many(passwordResets),
}))

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}))

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}))
