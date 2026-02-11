import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, integer, text, primaryKey, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { D as DEFAULT_SETTINGS, S as SETTING_KEYS, s as systemSettings } from "./settings-CebgkGhm.js";
import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
const ALL_ROLES = ["admin", "creator", "explorer"];
const DEFAULT_ROLES = ["explorer"];
function parseRoles(rolesJson) {
  if (!rolesJson) return [...DEFAULT_ROLES];
  try {
    const parsed = JSON.parse(rolesJson);
    if (Array.isArray(parsed)) {
      return parsed.filter((r) => ALL_ROLES.includes(r));
    }
  } catch {
    if (ALL_ROLES.includes(rolesJson)) {
      return [rolesJson];
    }
  }
  return [...DEFAULT_ROLES];
}
function serializeRoles(roles) {
  return JSON.stringify(roles);
}
function hasRole(roles, role) {
  return roles.includes(role);
}
const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default('["explorer"]'),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  anonymizedName: text("anonymized_name"),
  defaultSessionDifficulty: text("default_session_difficulty").$type().notNull().default("medium"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const passwordResets = sqliteTable("password_resets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const usersRelations = relations(users, ({ many }) => ({
  authSessions: many(authSessions),
  passwordResets: many(passwordResets)
}));
const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id]
  })
}));
const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id]
  })
}));
const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type().notNull(),
  parentId: text("parent_id").references(() => organizations.id, { onDelete: "cascade" }),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const orgMembers = sqliteTable("org_members", {
  orgId: text("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").$type().notNull().default("member"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => [
  primaryKey({ columns: [table.orgId, table.userId] })
]);
const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
    relationName: "parentChild"
  }),
  children: many(organizations, { relationName: "parentChild" }),
  members: many(orgMembers)
}));
const orgMembersRelations = relations(orgMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgMembers.orgId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [orgMembers.userId],
    references: [users.id]
  })
}));
const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  creatorId: text("creator_id").notNull().references(() => users.id),
  orgId: text("org_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description"),
  background: text("background"),
  drivingQuestion: text("driving_question"),
  joinCode: text("join_code").unique(),
  joinCodeExpiresAt: integer("join_code_expires_at", { mode: "timestamp" }),
  maxParticipants: integer("max_participants"),
  teamSize: integer("team_size").default(2),
  isTemplate: integer("is_template", { mode: "boolean" }).notNull().default(false),
  isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const projectSessions = sqliteTable("project_sessions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  order: integer("order").notNull(),
  title: text("title").notNull(),
  topic: text("topic"),
  guide: text("guide"),
  // Rich text guide for the session
  weight: real("weight").notNull().default(1),
  // For asymmetric timeline
  durationMinutes: integer("duration_minutes"),
  // Absolute session duration in minutes
  difficulty: text("difficulty").$type().notNull().default("medium"),
  deliverableType: text("deliverable_type").$type().notNull().default("document"),
  deliverableTitle: text("deliverable_title"),
  deliverableDescription: text("deliverable_description"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  llmModel: text("llm_model"),
  // Custom LLM model for this session
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const sessionResources = sqliteTable("session_resources", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => projectSessions.id, { onDelete: "cascade" }),
  type: text("type").$type().notNull(),
  title: text("title").notNull(),
  url: text("url"),
  filePath: text("file_path"),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const sessionRubrics = sqliteTable("session_rubrics", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => projectSessions.id, { onDelete: "cascade" }),
  criteria: text("criteria").notNull(),
  description: text("description"),
  weight: real("weight").notNull().default(1),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const sessionTemplates = sqliteTable("session_templates", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => projectSessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
  type: text("type").$type().notNull().default("document"),
  order: integer("order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.creatorId],
    references: [users.id]
  }),
  organization: one(organizations, {
    fields: [projects.orgId],
    references: [organizations.id]
  }),
  sessions: many(projectSessions)
}));
const projectSessionsRelations = relations(projectSessions, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectSessions.projectId],
    references: [projects.id]
  }),
  resources: many(sessionResources),
  rubrics: many(sessionRubrics),
  templates: many(sessionTemplates)
}));
const sessionResourcesRelations = relations(sessionResources, ({ one }) => ({
  session: one(projectSessions, {
    fields: [sessionResources.sessionId],
    references: [projectSessions.id]
  })
}));
const sessionRubricsRelations = relations(sessionRubrics, ({ one }) => ({
  session: one(projectSessions, {
    fields: [sessionRubrics.sessionId],
    references: [projectSessions.id]
  })
}));
const sessionTemplatesRelations = relations(sessionTemplates, ({ one }) => ({
  session: one(projectSessions, {
    fields: [sessionTemplates.sessionId],
    references: [projectSessions.id]
  })
}));
const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const teamMembers = sqliteTable("team_members", {
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentSessionId: text("current_session_id"),
  // Track which session user is on
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => [
  primaryKey({ columns: [table.teamId, table.userId] })
]);
const aiPersonas = sqliteTable("ai_personas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").$type().notNull(),
  description: text("description"),
  avatar: text("avatar"),
  systemPrompt: text("system_prompt").notNull(),
  traits: text("traits"),
  // JSON array of personality traits
  expertise: text("expertise"),
  // JSON array of expertise areas
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const teamAiPersonas = sqliteTable("team_ai_personas", {
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  personaId: text("persona_id").notNull().references(() => aiPersonas.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => [
  primaryKey({ columns: [table.teamId, table.personaId] })
]);
const projectInvitations = sqliteTable("project_invitations", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "set null" }),
  status: text("status").$type().notNull().default("pending"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  respondedAt: integer("responded_at", { mode: "timestamp" })
});
const experts = sqliteTable("experts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  expertise: text("expertise"),
  // JSON array
  avatarUrl: text("avatar_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const projectExperts = sqliteTable("project_experts", {
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  expertId: text("expert_id").notNull().references(() => experts.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => [
  primaryKey({ columns: [table.projectId, table.expertId] })
]);
const teamsRelations = relations(teams, ({ one, many }) => ({
  project: one(projects, {
    fields: [teams.projectId],
    references: [projects.id]
  }),
  members: many(teamMembers),
  aiPersonas: many(teamAiPersonas)
}));
const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id]
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  })
}));
const aiPersonasRelations = relations(aiPersonas, ({ many }) => ({
  teamAssignments: many(teamAiPersonas)
}));
const teamAiPersonasRelations = relations(teamAiPersonas, ({ one }) => ({
  team: one(teams, {
    fields: [teamAiPersonas.teamId],
    references: [teams.id]
  }),
  persona: one(aiPersonas, {
    fields: [teamAiPersonas.personaId],
    references: [aiPersonas.id]
  })
}));
const projectInvitationsRelations = relations(projectInvitations, ({ one }) => ({
  project: one(projects, {
    fields: [projectInvitations.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [projectInvitations.userId],
    references: [users.id]
  }),
  team: one(teams, {
    fields: [projectInvitations.teamId],
    references: [teams.id]
  })
}));
const expertsRelations = relations(experts, ({ many }) => ({
  projectAssignments: many(projectExperts)
}));
const projectExpertsRelations = relations(projectExperts, ({ one }) => ({
  project: one(projects, {
    fields: [projectExperts.projectId],
    references: [projects.id]
  }),
  expert: one(experts, {
    fields: [projectExperts.expertId],
    references: [experts.id]
  })
}));
const artifacts = sqliteTable("artifacts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  sessionId: text("session_id").notNull().references(() => projectSessions.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  // Current draft content
  contentType: text("content_type").$type().notNull().default("document"),
  status: text("status").$type().notNull().default("draft"),
  currentVersion: text("current_version"),
  lastPrecheckAt: integer("last_precheck_at", { mode: "timestamp" }),
  precheckPassed: integer("precheck_passed", { mode: "boolean" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const artifactVersions = sqliteTable("artifact_versions", {
  id: text("id").primaryKey(),
  artifactId: text("artifact_id").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  // e.g., "v1.0", "v1.1", "v2.0"
  content: text("content").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  submittedBy: text("submitted_by").notNull().references(() => users.id)
});
const precheckResults = sqliteTable("precheck_results", {
  id: text("id").primaryKey(),
  artifactId: text("artifact_id").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  overallScore: text("overall_score").$type().notNull(),
  feedback: text("feedback"),
  // JSON array of feedback items
  rubricScores: text("rubric_scores"),
  // JSON object mapping rubric criteria to scores
  contentSnapshot: text("content_snapshot"),
  // Artifact content at the time of precheck
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const precheckFeedbackItems = sqliteTable("precheck_feedback_items", {
  id: text("id").primaryKey(),
  precheckId: text("precheck_id").notNull().references(() => precheckResults.id, { onDelete: "cascade" }),
  severity: text("severity").$type().notNull(),
  message: text("message").notNull(),
  suggestion: text("suggestion"),
  lineNumber: integer("line_number"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const showcaseLinks = sqliteTable("showcase_links", {
  id: text("id").primaryKey(),
  artifactId: text("artifact_id").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  versionId: text("version_id").references(() => artifactVersions.id),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const artifactsRelations = relations(artifacts, ({ one, many }) => ({
  user: one(users, {
    fields: [artifacts.userId],
    references: [users.id]
  }),
  session: one(projectSessions, {
    fields: [artifacts.sessionId],
    references: [projectSessions.id]
  }),
  team: one(teams, {
    fields: [artifacts.teamId],
    references: [teams.id]
  }),
  versions: many(artifactVersions),
  precheckResults: many(precheckResults),
  showcaseLinks: many(showcaseLinks)
}));
const artifactVersionsRelations = relations(artifactVersions, ({ one }) => ({
  artifact: one(artifacts, {
    fields: [artifactVersions.artifactId],
    references: [artifacts.id]
  }),
  submitter: one(users, {
    fields: [artifactVersions.submittedBy],
    references: [users.id]
  })
}));
const precheckResultsRelations = relations(precheckResults, ({ one, many }) => ({
  artifact: one(artifacts, {
    fields: [precheckResults.artifactId],
    references: [artifacts.id]
  }),
  feedbackItems: many(precheckFeedbackItems)
}));
const precheckFeedbackItemsRelations = relations(precheckFeedbackItems, ({ one }) => ({
  precheck: one(precheckResults, {
    fields: [precheckFeedbackItems.precheckId],
    references: [precheckResults.id]
  })
}));
const showcaseLinksRelations = relations(showcaseLinks, ({ one }) => ({
  artifact: one(artifacts, {
    fields: [showcaseLinks.artifactId],
    references: [artifacts.id]
  }),
  version: one(artifactVersions, {
    fields: [showcaseLinks.versionId],
    references: [artifactVersions.id]
  })
}));
const chatRooms = sqliteTable("chat_rooms", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const chatRoomMembers = sqliteTable("chat_room_members", {
  roomId: text("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: integer("joined_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
}, (table) => [
  primaryKey({ columns: [table.roomId, table.userId] })
]);
const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => chatRooms.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  // null for AI messages
  personaId: text("persona_id").references(() => aiPersonas.id, { onDelete: "set null" }),
  // for AI messages
  content: text("content").notNull(),
  type: text("type").$type().notNull().default("text"),
  metadata: text("metadata"),
  // JSON for artifact shares, system info, etc.
  replyToId: text("reply_to_id").references(() => chatMessages.id, { onDelete: "set null" }),
  isEdited: integer("is_edited", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const messageReactions = sqliteTable("message_reactions", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull().references(() => chatMessages.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const floatingBotMessages = sqliteTable("floating_bot_messages", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").$type().notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  project: one(projects, {
    fields: [chatRooms.projectId],
    references: [projects.id]
  }),
  team: one(teams, {
    fields: [chatRooms.teamId],
    references: [teams.id]
  }),
  members: many(chatRoomMembers),
  messages: many(chatMessages)
}));
const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  room: one(chatRooms, {
    fields: [chatRoomMembers.roomId],
    references: [chatRooms.id]
  }),
  user: one(users, {
    fields: [chatRoomMembers.userId],
    references: [users.id]
  })
}));
const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  room: one(chatRooms, {
    fields: [chatMessages.roomId],
    references: [chatRooms.id]
  }),
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id]
  }),
  persona: one(aiPersonas, {
    fields: [chatMessages.personaId],
    references: [aiPersonas.id]
  }),
  replyTo: one(chatMessages, {
    fields: [chatMessages.replyToId],
    references: [chatMessages.id],
    relationName: "messageReplies"
  }),
  replies: many(chatMessages, { relationName: "messageReplies" }),
  reactions: many(messageReactions)
}));
const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(chatMessages, {
    fields: [messageReactions.messageId],
    references: [chatMessages.id]
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id]
  })
}));
const floatingBotMessagesRelations = relations(floatingBotMessages, ({ one }) => ({
  user: one(users, {
    fields: [floatingBotMessages.userId],
    references: [users.id]
  })
}));
const badges = sqliteTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").$type().notNull(),
  icon: text("icon").notNull(),
  // Icon identifier
  criteria: text("criteria").notNull(),
  // Human-readable criteria
  criteriaType: text("criteria_type").notNull(),
  // e.g., 'artifact_count', 'project_complete', 'competency_score'
  criteriaValue: integer("criteria_value").notNull(),
  // Threshold value
  xpReward: integer("xp_reward").notNull().default(15),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const userBadges = sqliteTable("user_badges", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: text("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
  earnedAt: integer("earned_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  context: text("context")
  // JSON with project/session info where badge was earned
}, (table) => [
  primaryKey({ columns: [table.userId, table.badgeId] })
]);
const competencyScores = sqliteTable("competency_scores", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  competency: text("competency").$type().notNull(),
  score: real("score").notNull().default(0),
  // 0-100 scale
  baselineScore: real("baseline_score"),
  // Score at first submission
  aiInsight: text("ai_insight"),
  // AI-generated insight text
  lastCalculatedAt: integer("last_calculated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const xpTransactions = sqliteTable("xp_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  // e.g., 'artifact_submitted', 'project_completed', 'badge_earned'
  entityType: text("entity_type"),
  // e.g., 'artifact', 'project', 'badge'
  entityId: text("entity_id"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const experienceSynthesis = sqliteTable("experience_synthesis", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  // 150-250 word summary
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  projectsIncluded: text("projects_included")
  // JSON array of project IDs included
});
const feedbackHistory = sqliteTable("feedback_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
  sessionId: text("session_id"),
  originalFeedback: text("original_feedback").notNull(),
  reframedFeedback: text("reframed_feedback").notNull(),
  competencyArea: text("competency_area").$type(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges)
}));
const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id]
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id]
  })
}));
const competencyScoresRelations = relations(competencyScores, ({ one }) => ({
  user: one(users, {
    fields: [competencyScores.userId],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [competencyScores.projectId],
    references: [projects.id]
  })
}));
const xpTransactionsRelations = relations(xpTransactions, ({ one }) => ({
  user: one(users, {
    fields: [xpTransactions.userId],
    references: [users.id]
  })
}));
const experienceSynthesisRelations = relations(experienceSynthesis, ({ one }) => ({
  user: one(users, {
    fields: [experienceSynthesis.userId],
    references: [users.id]
  })
}));
const feedbackHistoryRelations = relations(feedbackHistory, ({ one }) => ({
  user: one(users, {
    fields: [feedbackHistory.userId],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [feedbackHistory.projectId],
    references: [projects.id]
  })
}));
const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type().notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  data: text("data"),
  // JSON with additional context (artifact ID, session ID, etc.)
  actionUrl: text("action_url"),
  // Where to navigate when clicked
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  readAt: integer("read_at", { mode: "timestamp" })
});
const joinCodeAttempts = sqliteTable("join_code_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  code: text("code").notNull(),
  success: integer("success", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const aiInterventions = sqliteTable("ai_interventions", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  type: text("type").$type().notNull(),
  trigger: text("trigger").notNull(),
  // What triggered this intervention
  proposedAction: text("proposed_action").notNull(),
  status: text("status").$type().notNull().default("pending"),
  executedAt: integer("executed_at", { mode: "timestamp" }),
  executedBy: text("executed_by").references(() => users.id),
  result: text("result"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  // e.g., 'login', 'artifact_submit', 'chat_send'
  entityType: text("entity_type"),
  // e.g., 'project', 'artifact', 'session'
  entityId: text("entity_id"),
  metadata: text("metadata"),
  // JSON with additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id]
  }),
  team: one(teams, {
    fields: [notifications.teamId],
    references: [teams.id]
  })
}));
const joinCodeAttemptsRelations = relations(joinCodeAttempts, ({ one }) => ({
  user: one(users, {
    fields: [joinCodeAttempts.userId],
    references: [users.id]
  })
}));
const aiInterventionsRelations = relations(aiInterventions, ({ one }) => ({
  project: one(projects, {
    fields: [aiInterventions.projectId],
    references: [projects.id]
  }),
  team: one(teams, {
    fields: [aiInterventions.teamId],
    references: [teams.id]
  }),
  executor: one(users, {
    fields: [aiInterventions.executedBy],
    references: [users.id]
  })
}));
const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  })
}));
const learningMetrics = sqliteTable("learning_metrics", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  metricType: text("metric_type").$type().notNull(),
  value: real("value").notNull(),
  // 0-100 scale
  source: text("source").$type().notNull().default("system"),
  metadata: text("metadata"),
  // JSON for additional context
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const dailyMetricsAggregate = sqliteTable("daily_metrics_aggregate", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // YYYY-MM-DD format
  avgConfidence: real("avg_confidence"),
  avgEngagement: real("avg_engagement"),
  avgAiSupported: real("avg_ai_supported"),
  avgTraditional: real("avg_traditional"),
  sampleCount: integer("sample_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const learningMetricsRelations = relations(learningMetrics, ({ one }) => ({
  project: one(projects, {
    fields: [learningMetrics.projectId],
    references: [projects.id]
  }),
  team: one(teams, {
    fields: [learningMetrics.teamId],
    references: [teams.id]
  }),
  user: one(users, {
    fields: [learningMetrics.userId],
    references: [users.id]
  })
}));
const dailyMetricsAggregateRelations = relations(dailyMetricsAggregate, ({ one }) => ({
  project: one(projects, {
    fields: [dailyMetricsAggregate.projectId],
    references: [projects.id]
  })
}));
const interventionLogs = sqliteTable("intervention_logs", {
  id: text("id").primaryKey(),
  interventionId: text("intervention_id").notNull(),
  teamId: text("team_id").notNull(),
  messageId: text("message_id"),
  // Reference to chat message if applicable
  deliveredAt: integer("delivered_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date()),
  acknowledged: integer("acknowledged", { mode: "boolean" }).default(false),
  acknowledgedAt: integer("acknowledged_at", { mode: "timestamp" })
});
const teamRiskAssessments = sqliteTable("team_risk_assessments", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull(),
  riskLevel: text("risk_level").$type().notNull(),
  riskFactors: text("risk_factors"),
  // JSON array of factors contributing to risk
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
  sessionsBehind: integer("sessions_behind").default(0),
  precheckFailureRate: integer("precheck_failure_rate"),
  // percentage
  assessedAt: integer("assessed_at", { mode: "timestamp" }).notNull().$defaultFn(() => /* @__PURE__ */ new Date())
});
const interventionLogsRelations = relations(interventionLogs, ({}) => ({
  // Intervention reference is handled by notifications schema
}));
const teamRiskAssessmentsRelations = relations(teamRiskAssessments, ({ one }) => ({
  project: one(projects, {
    fields: [teamRiskAssessments.projectId],
    references: [projects.id]
  })
}));
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ALL_ROLES,
  DEFAULT_ROLES,
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  activityLogs,
  activityLogsRelations,
  aiInterventions,
  aiInterventionsRelations,
  aiPersonas,
  aiPersonasRelations,
  artifactVersions,
  artifactVersionsRelations,
  artifacts,
  artifactsRelations,
  authSessions,
  authSessionsRelations,
  badges,
  badgesRelations,
  chatMessages,
  chatMessagesRelations,
  chatRoomMembers,
  chatRoomMembersRelations,
  chatRooms,
  chatRoomsRelations,
  competencyScores,
  competencyScoresRelations,
  dailyMetricsAggregate,
  dailyMetricsAggregateRelations,
  experienceSynthesis,
  experienceSynthesisRelations,
  experts,
  expertsRelations,
  feedbackHistory,
  feedbackHistoryRelations,
  floatingBotMessages,
  floatingBotMessagesRelations,
  hasRole,
  interventionLogs,
  interventionLogsRelations,
  joinCodeAttempts,
  joinCodeAttemptsRelations,
  learningMetrics,
  learningMetricsRelations,
  messageReactions,
  messageReactionsRelations,
  notifications,
  notificationsRelations,
  orgMembers,
  orgMembersRelations,
  organizations,
  organizationsRelations,
  parseRoles,
  passwordResets,
  passwordResetsRelations,
  precheckFeedbackItems,
  precheckFeedbackItemsRelations,
  precheckResults,
  precheckResultsRelations,
  projectExperts,
  projectExpertsRelations,
  projectInvitations,
  projectInvitationsRelations,
  projectSessions,
  projectSessionsRelations,
  projects,
  projectsRelations,
  serializeRoles,
  sessionResources,
  sessionResourcesRelations,
  sessionRubrics,
  sessionRubricsRelations,
  sessionTemplates,
  sessionTemplatesRelations,
  showcaseLinks,
  showcaseLinksRelations,
  systemSettings,
  teamAiPersonas,
  teamAiPersonasRelations,
  teamMembers,
  teamMembersRelations,
  teamRiskAssessments,
  teamRiskAssessmentsRelations,
  teams,
  teamsRelations,
  userBadges,
  userBadgesRelations,
  users,
  usersRelations,
  xpTransactions,
  xpTransactionsRelations
}, Symbol.toStringTag, { value: "Module" }));
const DB_PATH = process.env.DATABASE_URL || join(process.cwd(), "data", "p3bl.db");
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });
export {
  chatRoomMembers as A,
  chatMessages as B,
  messageReactions as C,
  floatingBotMessages as D,
  aiPersonas as E,
  teamRiskAssessments as F,
  learningMetrics as G,
  aiInterventions as H,
  teamMembers as a,
  projectInvitations as b,
  projectSessions as c,
  db as d,
  parseRoles as e,
  sessionRubrics as f,
  sessionTemplates as g,
  serializeRoles as h,
  precheckResults as i,
  joinCodeAttempts as j,
  artifactVersions as k,
  artifacts as l,
  precheckFeedbackItems as m,
  notifications as n,
  showcaseLinks as o,
  projects as p,
  authSessions as q,
  passwordResets as r,
  sessionResources as s,
  teams as t,
  users as u,
  userBadges as v,
  badges as w,
  competencyScores as x,
  xpTransactions as y,
  chatRooms as z
};
