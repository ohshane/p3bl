import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { projects } from './projects'

// Extended intervention types for creator dashboard
export type CreatorInterventionType = 'proactive' | 'reactive' | 'scheduled'
export type CreatorInterventionStatus = 'proposed' | 'approved' | 'rejected' | 'executed'

// Intervention logs (for tracking what happened when executed)
export const interventionLogs = sqliteTable('intervention_logs', {
  id: text('id').primaryKey(),
  interventionId: text('intervention_id').notNull(),
  teamId: text('team_id').notNull(),
  messageId: text('message_id'), // Reference to chat message if applicable
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  acknowledged: integer('acknowledged', { mode: 'boolean' }).default(false),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
})

// Team risk assessments (periodic snapshots)
export const teamRiskAssessments = sqliteTable('team_risk_assessments', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  teamId: text('team_id').notNull(),
  riskLevel: text('risk_level').$type<'green' | 'yellow' | 'red'>().notNull(),
  riskFactors: text('risk_factors'), // JSON array of factors contributing to risk
  lastActivityAt: integer('last_activity_at', { mode: 'timestamp' }),
  sessionsBehind: integer('sessions_behind').default(0),
  precheckFailureRate: integer('precheck_failure_rate'), // percentage
  assessedAt: integer('assessed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations for intervention logs
export const interventionLogsRelations = relations(interventionLogs, ({ }) => ({
  // Intervention reference is handled by notifications schema
}))



export const teamRiskAssessmentsRelations = relations(teamRiskAssessments, ({ one }) => ({
  project: one(projects, {
    fields: [teamRiskAssessments.projectId],
    references: [projects.id],
  }),
}))
