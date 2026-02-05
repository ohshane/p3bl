import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { projects } from './projects'

// Badge categories
export type BadgeCategory = 'milestone' | 'engagement' | 'collaboration' | 'competency'

// Competency types (5 core competencies)
export type CompetencyType = 'critical_thinking' | 'communication' | 'collaboration' | 'creativity' | 'problem_solving'

// Badges table
export const badges = sqliteTable('badges', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').$type<BadgeCategory>().notNull(),
  icon: text('icon').notNull(), // Icon identifier
  criteria: text('criteria').notNull(), // Human-readable criteria
  criteriaType: text('criteria_type').notNull(), // e.g., 'artifact_count', 'project_complete', 'competency_score'
  criteriaValue: integer('criteria_value').notNull(), // Threshold value
  xpReward: integer('xp_reward').notNull().default(15),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// User badges (earned badges)
export const userBadges = sqliteTable('user_badges', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: text('badge_id').notNull().references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: integer('earned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  context: text('context'), // JSON with project/session info where badge was earned
}, (table) => [
  primaryKey({ columns: [table.userId, table.badgeId] }),
])

// Competency scores
export const competencyScores = sqliteTable('competency_scores', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  competency: text('competency').$type<CompetencyType>().notNull(),
  score: real('score').notNull().default(0), // 0-100 scale
  baselineScore: real('baseline_score'), // Score at first submission
  aiInsight: text('ai_insight'), // AI-generated insight text
  lastCalculatedAt: integer('last_calculated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// XP transactions (audit log of XP earned)
export const xpTransactions = sqliteTable('xp_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(), // e.g., 'artifact_submitted', 'project_completed', 'badge_earned'
  entityType: text('entity_type'), // e.g., 'artifact', 'project', 'badge'
  entityId: text('entity_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Experience synthesis (AI-generated portfolio summary)
export const experienceSynthesis = sqliteTable('experience_synthesis', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(), // 150-250 word summary
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  projectsIncluded: text('projects_included'), // JSON array of project IDs included
})

// Feedback history (AI-reframed positive feedback)
export const feedbackHistory = sqliteTable('feedback_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  sessionId: text('session_id'),
  originalFeedback: text('original_feedback').notNull(),
  reframedFeedback: text('reframed_feedback').notNull(),
  competencyArea: text('competency_area').$type<CompetencyType>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Hall of Fame entries (monthly snapshots)
export const hallOfFameEntries = sqliteTable('hall_of_fame_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  month: text('month').notNull(), // Format: "2024-01"
  rank: integer('rank').notNull(),
  xpEarned: integer('xp_earned').notNull(),
  competencyGrowth: real('competency_growth').notNull(),
  projectsCompleted: integer('projects_completed').notNull(),
  totalScore: real('total_score').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}))

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}))

export const competencyScoresRelations = relations(competencyScores, ({ one }) => ({
  user: one(users, {
    fields: [competencyScores.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [competencyScores.projectId],
    references: [projects.id],
  }),
}))

export const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  user: one(users, {
    fields: [xpTransactions.userId],
    references: [users.id],
  }),
}))

export const experienceSynthesisRelations = relations(experienceSynthesis, ({ one }) => ({
  user: one(users, {
    fields: [experienceSynthesis.userId],
    references: [users.id],
  }),
}))

export const feedbackHistoryRelations = relations(feedbackHistory, ({ one }) => ({
  user: one(users, {
    fields: [feedbackHistory.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [feedbackHistory.projectId],
    references: [projects.id],
  }),
}))

export const hallOfFameEntriesRelations = relations(hallOfFameEntries, ({ one }) => ({
  user: one(users, {
    fields: [hallOfFameEntries.userId],
    references: [users.id],
  }),
}))
