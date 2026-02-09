import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { aiPersonas, teams } from './teams'
import { projects } from './projects'

// Message types
export type MessageType = 'text' | 'artifact_share' | 'system' | 'ai_intervention'

// Chat rooms - one per team within a project
export const chatRooms = sqliteTable('chat_rooms', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Chat room members - tracks which users belong to which room
export const chatRoomMembers = sqliteTable('chat_room_members', {
  roomId: text('room_id').notNull().references(() => chatRooms.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  primaryKey({ columns: [table.roomId, table.userId] }),
])

// Chat messages - belong to a room
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => chatRooms.id, { onDelete: 'cascade' }),
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

// Floating bot conversations (separate from room chat)
export const floatingBotMessages = sqliteTable('floating_bot_messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').$type<'user' | 'assistant'>().notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// Relations
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  project: one(projects, {
    fields: [chatRooms.projectId],
    references: [projects.id],
  }),
  team: one(teams, {
    fields: [chatRooms.teamId],
    references: [teams.id],
  }),
  members: many(chatRoomMembers),
  messages: many(chatMessages),
}))

export const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatRoomMembers.roomId],
    references: [chatRooms.id],
  }),
  user: one(users, {
    fields: [chatRoomMembers.userId],
    references: [users.id],
  }),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id],
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
