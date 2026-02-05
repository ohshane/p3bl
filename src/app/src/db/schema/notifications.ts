import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { projects } from './projects'
import { teams } from './teams'

// Notification types
export type NotificationType = 
  | 'new_feedback'
  | 'review_complete'
  | 'session_unlocked'
  | 'deadline_reminder'
  | 'team_message'
  | 'badge_earned'
  | 'level_up'
  | 'project_invitation'
  | 'ai_intervention'
  | 'system'

// Notifications table
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<NotificationType>().notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  data: text('data'), // JSON with additional context (artifact ID, session ID, etc.)
  actionUrl: text('action_url'), // Where to navigate when clicked
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  readAt: integer('read_at', { mode: 'timestamp' }),
})

// Join code attempts (for rate limiting)
export const joinCodeAttempts = sqliteTable('join_code_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address'),
  code: text('code').notNull(),
  success: integer('success', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// AI interventions (proactive AI actions)
export const aiInterventions = sqliteTable('ai_interventions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  type: text('type').$type<'inactivity' | 'conflict' | 'deadline' | 'engagement' | 'custom'>().notNull(),
  trigger: text('trigger').notNull(), // What triggered this intervention
  proposedAction: text('proposed_action').notNull(),
  status: text('status').$type<'pending' | 'approved' | 'rejected' | 'executed'>().notNull().default('pending'),
  executedAt: integer('executed_at', { mode: 'timestamp' }),
  executedBy: text('executed_by').references(() => users.id),
  result: text('result'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Activity logs (for analytics)
export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // e.g., 'login', 'artifact_submit', 'chat_send'
  entityType: text('entity_type'), // e.g., 'project', 'artifact', 'session'
  entityId: text('entity_id'),
  metadata: text('metadata'), // JSON with additional context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  team: one(teams, {
    fields: [notifications.teamId],
    references: [teams.id],
  }),
}))

export const joinCodeAttemptsRelations = relations(joinCodeAttempts, ({ one }) => ({
  user: one(users, {
    fields: [joinCodeAttempts.userId],
    references: [users.id],
  }),
}))

export const aiInterventionsRelations = relations(aiInterventions, ({ one }) => ({
  project: one(projects, {
    fields: [aiInterventions.projectId],
    references: [projects.id],
  }),
  team: one(teams, {
    fields: [aiInterventions.teamId],
    references: [teams.id],
  }),
  executor: one(users, {
    fields: [aiInterventions.executedBy],
    references: [users.id],
  }),
}))

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}))
