import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { projects } from './projects'
import { teams } from './teams'
import { users } from './users'

// Learning metric types for tracking confidence/engagement over time
export type MetricType = 'confidence' | 'engagement' | 'ai_supported' | 'traditional'
export type MetricSource = 'survey' | 'ai_inferred' | 'system' | 'activity'

// Learning metrics table (for DipChart visualization)
export const learningMetrics = sqliteTable('learning_metrics', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  metricType: text('metric_type').$type<MetricType>().notNull(),
  value: real('value').notNull(), // 0-100 scale
  source: text('source').$type<MetricSource>().notNull().default('system'),
  metadata: text('metadata'), // JSON for additional context
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Daily aggregated metrics (for faster chart queries)
export const dailyMetricsAggregate = sqliteTable('daily_metrics_aggregate', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD format
  avgConfidence: real('avg_confidence'),
  avgEngagement: real('avg_engagement'),
  avgAiSupported: real('avg_ai_supported'),
  avgTraditional: real('avg_traditional'),
  sampleCount: integer('sample_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const learningMetricsRelations = relations(learningMetrics, ({ one }) => ({
  project: one(projects, {
    fields: [learningMetrics.projectId],
    references: [projects.id],
  }),
  team: one(teams, {
    fields: [learningMetrics.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [learningMetrics.userId],
    references: [users.id],
  }),
}))

export const dailyMetricsAggregateRelations = relations(dailyMetricsAggregate, ({ one }) => ({
  project: one(projects, {
    fields: [dailyMetricsAggregate.projectId],
    references: [projects.id],
  }),
}))
