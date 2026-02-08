import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { projects } from './projects'

// AI Persona types
export type PersonaType = 'tutor' | 'critic' | 'facilitator' | 'expert' | 'peer'

// Teams table
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Team members (junction table)
export const teamMembers = sqliteTable('team_members', {
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  currentSessionId: text('current_session_id'), // Track which session user is on
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  primaryKey({ columns: [table.teamId, table.userId] }),
])

// AI Personas (system-wide definitions)
export const aiPersonas = sqliteTable('ai_personas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').$type<PersonaType>().notNull(),
  description: text('description'),
  avatar: text('avatar'),
  systemPrompt: text('system_prompt').notNull(),
  traits: text('traits'), // JSON array of personality traits
  expertise: text('expertise'), // JSON array of expertise areas
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Team AI personas (which personas are assigned to which team)
export const teamAiPersonas = sqliteTable('team_ai_personas', {
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  personaId: text('persona_id').notNull().references(() => aiPersonas.id, { onDelete: 'cascade' }),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  primaryKey({ columns: [table.teamId, table.personaId] }),
])

// Project invitations (pending invites)
export const projectInvitations = sqliteTable('project_invitations', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'set null' }),
  status: text('status').$type<'pending' | 'accepted' | 'dismissed' | 'expired' | 'removed'>().notNull().default('pending'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  respondedAt: integer('responded_at', { mode: 'timestamp' }),
})

// External experts
export const experts = sqliteTable('experts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  bio: text('bio'),
  expertise: text('expertise'), // JSON array
  avatarUrl: text('avatar_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Project experts (which experts are assigned to which project)
export const projectExperts = sqliteTable('project_experts', {
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  expertId: text('expert_id').notNull().references(() => experts.id, { onDelete: 'cascade' }),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  primaryKey({ columns: [table.projectId, table.expertId] }),
])

// Relations
export const teamsRelations = relations(teams, ({ one, many }) => ({
  project: one(projects, {
    fields: [teams.projectId],
    references: [projects.id],
  }),
  members: many(teamMembers),
  aiPersonas: many(teamAiPersonas),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}))

export const aiPersonasRelations = relations(aiPersonas, ({ many }) => ({
  teamAssignments: many(teamAiPersonas),
}))

export const teamAiPersonasRelations = relations(teamAiPersonas, ({ one }) => ({
  team: one(teams, {
    fields: [teamAiPersonas.teamId],
    references: [teams.id],
  }),
  persona: one(aiPersonas, {
    fields: [teamAiPersonas.personaId],
    references: [aiPersonas.id],
  }),
}))

export const projectInvitationsRelations = relations(projectInvitations, ({ one }) => ({
  project: one(projects, {
    fields: [projectInvitations.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectInvitations.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [projectInvitations.teamId],
    references: [teams.id],
  }),
}))

export const expertsRelations = relations(experts, ({ many }) => ({
  projectAssignments: many(projectExperts),
}))

export const projectExpertsRelations = relations(projectExperts, ({ one }) => ({
  project: one(projects, {
    fields: [projectExperts.projectId],
    references: [projects.id],
  }),
  expert: one(experts, {
    fields: [projectExperts.expertId],
    references: [experts.id],
  }),
}))
