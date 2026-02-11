import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { organizations } from './organizations'

// Deliverable types
export type DeliverableType = 'none' | 'document'
export type SessionDifficulty = 'easy' | 'medium' | 'hard'

// Projects table
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  creatorId: text('creator_id').notNull().references(() => users.id),
  orgId: text('org_id').references(() => organizations.id),
  title: text('title').notNull(),
  description: text('description'),
  background: text('background'),
  drivingQuestion: text('driving_question'),

  joinCode: text('join_code').unique(),
  joinCodeExpiresAt: integer('join_code_expires_at', { mode: 'timestamp' }),
  maxParticipants: integer('max_participants'),
  teamSize: integer('team_size').default(2),
  isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Project sessions (learning activities within a project)
export const projectSessions = sqliteTable('project_sessions', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  topic: text('topic'),
  guide: text('guide'), // Rich text guide for the session
  weight: real('weight').notNull().default(1), // For asymmetric timeline
  durationMinutes: integer('duration_minutes'), // Absolute session duration in minutes
  difficulty: text('difficulty').$type<SessionDifficulty>().notNull().default('medium'),
  deliverableType: text('deliverable_type').$type<DeliverableType>().notNull().default('document'),
  deliverableTitle: text('deliverable_title'),
  deliverableDescription: text('deliverable_description'),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  llmModel: text('llm_model'), // Custom LLM model for this session
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Session resources (files, links, videos)
export const sessionResources = sqliteTable('session_resources', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => projectSessions.id, { onDelete: 'cascade' }),
  type: text('type').$type<'pdf' | 'link' | 'video' | 'document' | 'image'>().notNull(),
  title: text('title').notNull(),
  url: text('url'),
  filePath: text('file_path'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Session rubrics
export const sessionRubrics = sqliteTable('session_rubrics', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => projectSessions.id, { onDelete: 'cascade' }),
  criteria: text('criteria').notNull(),
  description: text('description'),
  weight: real('weight').notNull().default(1),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Session templates
export const sessionTemplates = sqliteTable('session_templates', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => projectSessions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  type: text('type').$type<'document' | 'code' | 'markdown'>().notNull().default('document'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id],
  }),
  sessions: many(projectSessions),
}))

export const projectSessionsRelations = relations(projectSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectSessions.projectId],
    references: [projects.id],
  }),
  resources: many(sessionResources),
  rubrics: many(sessionRubrics),
  templates: many(sessionTemplates),
}))

export const sessionResourcesRelations = relations(sessionResources, ({ one }) => ({
  session: one(projectSessions, {
    fields: [sessionResources.sessionId],
    references: [projectSessions.id],
  }),
}))

export const sessionRubricsRelations = relations(sessionRubrics, ({ one }) => ({
  session: one(projectSessions, {
    fields: [sessionRubrics.sessionId],
    references: [projectSessions.id],
  }),
}))

export const sessionTemplatesRelations = relations(sessionTemplates, ({ one }) => ({
  session: one(projectSessions, {
    fields: [sessionTemplates.sessionId],
    references: [projectSessions.id],
  }),
}))
