import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { projectSessions } from './projects'
import { teams } from './teams'

// Artifact status
export type ArtifactStatus = 'draft' | 'precheck_pending' | 'precheck_complete' | 'submitted' | 'under_review' | 'needs_revision' | 'approved'

// Pre-check severity levels
export type PrecheckSeverity = 'critical' | 'warning' | 'suggestion'

// Artifacts table
export const artifacts = sqliteTable('artifacts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  sessionId: text('session_id').notNull().references(() => projectSessions.id, { onDelete: 'cascade' }),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'), // Current draft content
  contentType: text('content_type').$type<'document'>().notNull().default('document'),
  status: text('status').$type<ArtifactStatus>().notNull().default('draft'),
  currentVersion: text('current_version'),
  lastPrecheckAt: integer('last_precheck_at', { mode: 'timestamp' }),
  precheckPassed: integer('precheck_passed', { mode: 'boolean' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Artifact versions (immutable snapshots on submission)
export const artifactVersions = sqliteTable('artifact_versions', {
  id: text('id').primaryKey(),
  artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }),
  version: text('version').notNull(), // e.g., "v1.0", "v1.1", "v2.0"
  content: text('content').notNull(),
  submittedAt: integer('submitted_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  submittedBy: text('submitted_by').notNull().references(() => users.id),
})

// AI Pre-check results
export const precheckResults = sqliteTable('precheck_results', {
  id: text('id').primaryKey(),
  artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }),
  overallScore: text('overall_score').$type<'ready' | 'needs_work' | 'critical_issues'>().notNull(),
  feedback: text('feedback'), // JSON array of feedback items
  rubricScores: text('rubric_scores'), // JSON object mapping rubric criteria to scores
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Pre-check feedback items
export const precheckFeedbackItems = sqliteTable('precheck_feedback_items', {
  id: text('id').primaryKey(),
  precheckId: text('precheck_id').notNull().references(() => precheckResults.id, { onDelete: 'cascade' }),
  severity: text('severity').$type<PrecheckSeverity>().notNull(),
  message: text('message').notNull(),
  suggestion: text('suggestion'),
  lineNumber: integer('line_number'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Showcase links (public sharing)
export const showcaseLinks = sqliteTable('showcase_links', {
  id: text('id').primaryKey(),
  artifactId: text('artifact_id').notNull().references(() => artifacts.id, { onDelete: 'cascade' }),
  versionId: text('version_id').references(() => artifactVersions.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  viewCount: integer('view_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const artifactsRelations = relations(artifacts, ({ one, many }) => ({
  user: one(users, {
    fields: [artifacts.userId],
    references: [users.id],
  }),
  session: one(projectSessions, {
    fields: [artifacts.sessionId],
    references: [projectSessions.id],
  }),
  team: one(teams, {
    fields: [artifacts.teamId],
    references: [teams.id],
  }),
  versions: many(artifactVersions),
  precheckResults: many(precheckResults),
  showcaseLinks: many(showcaseLinks),
}))

export const artifactVersionsRelations = relations(artifactVersions, ({ one }) => ({
  artifact: one(artifacts, {
    fields: [artifactVersions.artifactId],
    references: [artifacts.id],
  }),
  submitter: one(users, {
    fields: [artifactVersions.submittedBy],
    references: [users.id],
  }),
}))

export const precheckResultsRelations = relations(precheckResults, ({ one, many }) => ({
  artifact: one(artifacts, {
    fields: [precheckResults.artifactId],
    references: [artifacts.id],
  }),
  feedbackItems: many(precheckFeedbackItems),
}))

export const precheckFeedbackItemsRelations = relations(precheckFeedbackItems, ({ one }) => ({
  precheck: one(precheckResults, {
    fields: [precheckFeedbackItems.precheckId],
    references: [precheckResults.id],
  }),
}))

export const showcaseLinksRelations = relations(showcaseLinks, ({ one }) => ({
  artifact: one(artifacts, {
    fields: [showcaseLinks.artifactId],
    references: [artifacts.id],
  }),
  version: one(artifactVersions, {
    fields: [showcaseLinks.versionId],
    references: [artifactVersions.id],
  }),
}))
