import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { teams, aiPersonas } from './teams'
import { artifacts } from './artifacts'

// Message types
export type MessageType = 'text' | 'artifact_share' | 'system' | 'ai_intervention'

// Chat messages
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // null for AI messages
  personaId: text('persona_id').references(() => aiPersonas.id, { onDelete: 'set null' }), // for AI messages
  content: text('content').notNull(),
  type: text('type').$type<MessageType>().notNull().default('text'),
  metadata: text('metadata'), // JSON for artifact shares, system info, etc.
  replyToId: text('reply_to_id').references((): any => chatMessages.id, { onDelete: 'set null' }),
  isEdited: integer('is_edited', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Message reactions
export const messageReactions = sqliteTable('message_reactions', {
  id: text('id').primaryKey(),
  messageId: text('message_id').notNull().references(() => chatMessages.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emoji: text('emoji').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Floating bot conversations (separate from team chat)
export const floatingBotMessages = sqliteTable('floating_bot_messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').$type<'user' | 'assistant'>().notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  team: one(teams, {
    fields: [chatMessages.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  persona: one(aiPersonas, {
    fields: [chatMessages.personaId],
    references: [aiPersonas.id],
  }),
  replyTo: one(chatMessages, {
    fields: [chatMessages.replyToId],
    references: [chatMessages.id],
    relationName: 'messageReplies',
  }),
  replies: many(chatMessages, { relationName: 'messageReplies' }),
  reactions: many(messageReactions),
}))

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(chatMessages, {
    fields: [messageReactions.messageId],
    references: [chatMessages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}))

export const floatingBotMessagesRelations = relations(floatingBotMessages, ({ one }) => ({
  user: one(users, {
    fields: [floatingBotMessages.userId],
    references: [users.id],
  }),
}))
