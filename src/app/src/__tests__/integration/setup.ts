/**
 * Integration test setup
 *
 * This file sets up an in-memory SQLite database for integration tests.
 * It creates tables directly and provides utilities for test data management.
 */

import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import * as schema from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'
import { hashPassword } from '@/server/auth'
import { sqlite as appSqlite, db as appDb } from '@/db'

// Use app database for tests to ensure server functions usage works
let sqlite: Database.Database
let testDb: BetterSQLite3Database<typeof schema>

export function setupTestDb() {
  sqlite = appSqlite
  sqlite.pragma('foreign_keys = OFF') // Disable during table creation

  testDb = appDb as unknown as BetterSQLite3Database<typeof schema>

  // Create tables individually to avoid bulk execution errors masking issues
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'explorer' NOT NULL,
      xp INTEGER DEFAULT 0 NOT NULL,
      level INTEGER DEFAULT 1 NOT NULL,
      anonymized_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      refresh_token TEXT NOT NULL UNIQUE,
      user_agent TEXT,
      ip_address TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (parent_id) REFERENCES organizations(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS org_members (
      org_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member' NOT NULL,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (org_id, user_id),
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      creator_id TEXT NOT NULL,
      org_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      background TEXT,
      driving_question TEXT,
      status TEXT DEFAULT 'draft' NOT NULL,
      join_code TEXT,
      join_code_expires_at INTEGER,
      max_participants INTEGER,
      team_size INTEGER DEFAULT 4,
      start_date INTEGER,
      end_date INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );`,
    `CREATE TABLE IF NOT EXISTS project_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      title TEXT NOT NULL,
      topic TEXT,
      guide TEXT,
      weight REAL DEFAULT 1 NOT NULL,
      deliverable_type TEXT DEFAULT 'document' NOT NULL,
      deliverable_title TEXT,
      deliverable_description TEXT,
      due_date INTEGER,
      llm_model TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS session_resources (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT,
      file_path TEXT,
      "order" INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES project_sessions(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS session_rubrics (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      criteria TEXT NOT NULL,
      description TEXT,
      weight REAL DEFAULT 1 NOT NULL,
      "order" INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES project_sessions(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS session_templates (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'document' NOT NULL,
      "order" INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES project_sessions(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      current_session_id TEXT,
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (team_id, user_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS ai_personas (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      avatar TEXT,
      system_prompt TEXT NOT NULL,
      traits TEXT,
      expertise TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS team_ai_personas (
      team_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      assigned_at INTEGER NOT NULL,
      PRIMARY KEY (team_id, persona_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (persona_id) REFERENCES ai_personas(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS project_invitations (
      id TEXT PRIMARY KEY NOT NULL,
      project_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      team_id TEXT,
      status TEXT DEFAULT 'pending' NOT NULL,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      responded_at INTEGER,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS experts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      bio TEXT,
      expertise TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS project_experts (
      project_id TEXT NOT NULL,
      expert_id TEXT NOT NULL,
      assigned_at INTEGER NOT NULL,
      PRIMARY KEY (project_id, expert_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      content_type TEXT DEFAULT 'document' NOT NULL,
      status TEXT DEFAULT 'draft' NOT NULL,
      current_version TEXT,
      last_precheck_at INTEGER,
      precheck_passed INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (session_id) REFERENCES project_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    );`,
    `CREATE TABLE IF NOT EXISTS artifact_versions (
      id TEXT PRIMARY KEY NOT NULL,
      artifact_id TEXT NOT NULL,
      version TEXT NOT NULL,
      content TEXT NOT NULL,
      submitted_at INTEGER NOT NULL,
      submitted_by TEXT NOT NULL,
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by) REFERENCES users(id)
    );`,
    `CREATE TABLE IF NOT EXISTS precheck_results (
      id TEXT PRIMARY KEY NOT NULL,
      artifact_id TEXT NOT NULL,
      overall_score TEXT NOT NULL,
      feedback TEXT,
      rubric_scores TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS precheck_feedback_items (
      id TEXT PRIMARY KEY NOT NULL,
      precheck_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      suggestion TEXT,
      line_number INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (precheck_id) REFERENCES precheck_results(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS showcase_links (
      id TEXT PRIMARY KEY NOT NULL,
      artifact_id TEXT NOT NULL,
      version_id TEXT,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER,
      is_active INTEGER DEFAULT 1 NOT NULL,
      view_count INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES artifact_versions(id)
    );`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY NOT NULL,
      team_id TEXT NOT NULL,
      user_id TEXT,
      persona_id TEXT,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text' NOT NULL,
      metadata TEXT,
      reply_to_id TEXT,
      is_edited INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (persona_id) REFERENCES ai_personas(id),
      FOREIGN KEY (reply_to_id) REFERENCES chat_messages(id)
    );`,
    `CREATE TABLE IF NOT EXISTS message_reactions (
      id TEXT PRIMARY KEY NOT NULL,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS floating_bot_messages (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      criteria TEXT NOT NULL,
      criteria_type TEXT NOT NULL,
      criteria_value INTEGER NOT NULL,
      xp_reward INTEGER DEFAULT 15 NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS user_badges (
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at INTEGER NOT NULL,
      context TEXT,
      PRIMARY KEY (user_id, badge_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS competency_scores (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      competency TEXT NOT NULL,
      score REAL DEFAULT 0 NOT NULL,
      baseline_score REAL,
      ai_insight TEXT,
      last_calculated_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS xp_transactions (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS experience_synthesis (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      generated_at INTEGER NOT NULL,
      projects_included TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS feedback_history (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      project_id TEXT,
      session_id TEXT,
      original_feedback TEXT NOT NULL,
      reframed_feedback TEXT NOT NULL,
      competency_area TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      project_id TEXT,
      team_id TEXT,
      data TEXT,
      action_url TEXT,
      is_read INTEGER DEFAULT 0 NOT NULL,
      read_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS join_code_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      ip_address TEXT,
      code TEXT NOT NULL,
      success INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS ai_interventions (
      id TEXT PRIMARY KEY NOT NULL,
      team_id TEXT NOT NULL,
      persona_id TEXT NOT NULL,
      trigger_type TEXT NOT NULL,
      context TEXT,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (persona_id) REFERENCES ai_personas(id)
    );`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );`
  ]

  tables.forEach(sql => sqlite.exec(sql))

  // Re-enable foreign keys
  sqlite.pragma('foreign_keys = ON')

  return testDb
}

export function getTestDb() {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDb() first.')
  }
  return testDb
}

export function closeTestDb() {
  // Do not close shared connection
  // if (sqlite) {
  //   sqlite.close()
  // }
}

export function clearTestDb() {
  if (!testDb) return

  // Clear tables in reverse dependency order using raw SQL to avoid schema mismatches
  sqlite.exec(`
    DELETE FROM precheck_feedback_items;
    DELETE FROM precheck_results;
    DELETE FROM showcase_links;
    DELETE FROM artifact_versions;
    DELETE FROM artifacts;
    DELETE FROM message_reactions;
    DELETE FROM chat_messages;
    DELETE FROM floating_bot_messages;
    DELETE FROM ai_interventions;
    DELETE FROM activity_logs;
    DELETE FROM notifications;
    DELETE FROM join_code_attempts;
    DELETE FROM project_invitations;
    DELETE FROM project_experts;
    DELETE FROM experts;
    DELETE FROM team_ai_personas;
    DELETE FROM team_members;
    DELETE FROM teams;
    DELETE FROM session_templates;
    DELETE FROM session_rubrics;
    DELETE FROM session_resources;
    DELETE FROM project_sessions;
    DELETE FROM projects;
    DELETE FROM xp_transactions;
    DELETE FROM feedback_history;
    DELETE FROM experience_synthesis;
    DELETE FROM competency_scores;
    DELETE FROM user_badges;
    DELETE FROM badges;
    DELETE FROM ai_personas;
    DELETE FROM password_resets;
    DELETE FROM auth_sessions;
    DELETE FROM org_members;
    DELETE FROM organizations;
    DELETE FROM users;
  `)
}

// Test data factories
export interface TestUser {
  id: string
  email: string
  password: string
  name: string
  role: string
}

export async function createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
  const db = getTestDb()
  const id = overrides.id || uuidv4()
  const password = overrides.password || 'TestPassword123'
  const passwordHash = await hashPassword(password)
  const now = new Date()

  const user: TestUser = {
    id,
    email: overrides.email || `test-${id.substring(0, 8)}@example.com`,
    password,
    name: overrides.name || `Test User ${id.substring(0, 8)}`,
    role: overrides.role || '["explorer"]',
  }

  await db.insert(schema.users).values({
    id: user.id,
    email: user.email,
    passwordHash,
    name: user.name,
    role: user.role,
    xp: 0,
    level: 1,
    anonymizedName: `TestUser_${id.substring(0, 8)}`,
    createdAt: now,
    updatedAt: now,
  })

  return user
}

export async function createTestProject(creatorId: string, overrides: Partial<{
  id: string
  title: string
  joinCode: string
  startDate: Date
  endDate: Date
}> = {}) {
  const db = getTestDb()
  const id = overrides.id || uuidv4()
  const now = new Date()
  // Default to an "opened" project (started, not yet ended)
  const defaultStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
  const defaultEndDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000) // 21 days from now

  const project = {
    id,
    creatorId,
    title: overrides.title || `Test Project ${id.substring(0, 8)}`,
    joinCode: overrides.joinCode || id.substring(0, 6).toUpperCase(),
    teamSize: 4,
    startDate: overrides.startDate ?? defaultStartDate,
    endDate: overrides.endDate ?? defaultEndDate,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(schema.projects).values(project)
  return project
}

export async function createTestSession(projectId: string, overrides: Partial<{
  id: string
  title: string
  order: number
}> = {}) {
  const db = getTestDb()
  const id = overrides.id || uuidv4()
  const now = new Date()

  const session = {
    id,
    projectId,
    title: overrides.title || `Test Session ${id.substring(0, 8)}`,
    order: overrides.order || 1,
    weight: 1,
    deliverableType: 'document' as const,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(schema.projectSessions).values(session)
  return session
}

export async function createTestTeam(projectId: string, overrides: Partial<{
  id: string
  name: string
}> = {}) {
  const db = getTestDb()
  const id = overrides.id || uuidv4()
  const now = new Date()

  const team = {
    id,
    projectId,
    name: overrides.name || `Test Team ${id.substring(0, 8)}`,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(schema.teams).values(team)
  return team
}

export async function addUserToTeam(userId: string, teamId: string, sessionId?: string) {
  const db = getTestDb()
  const now = new Date()

  await db.insert(schema.teamMembers).values({
    teamId,
    userId,
    currentSessionId: sessionId,
    joinedAt: now,
  })
}

export async function createTestArtifact(userId: string, sessionId: string, teamId: string, overrides: Partial<{
  id: string
  title: string
  content: string
  status: 'draft' | 'submitted' | 'precheck_complete' | 'reviewed'
}> = {}) {
  const db = getTestDb()
  const id = overrides.id || uuidv4()
  const now = new Date()

  const artifact = {
    id,
    userId,
    sessionId,
    teamId,
    title: overrides.title || `Test Artifact ${id.substring(0, 8)}`,
    content: overrides.content || 'Test artifact content',
    contentType: 'document' as const,
    status: overrides.status || 'draft',
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(schema.artifacts).values(artifact)
  return artifact
}

export async function createTestPersona(overrides: Partial<{
  id: string
  name: string
  type: 'tutor' | 'critic' | 'facilitator' | 'expert' | 'peer'
}> = {}) {
  const db = getTestDb()
  const id = overrides.id || uuidv4()
  const now = new Date()

  const persona = {
    id,
    name: overrides.name || `Test Persona ${id.substring(0, 8)}`,
    type: overrides.type || 'tutor',
    description: 'A test AI persona',
    avatar: 'test-avatar.png',
    systemPrompt: 'You are a helpful AI assistant.',
    isActive: true,
    createdAt: now,
  }

  await db.insert(schema.aiPersonas).values(persona)
  return persona
}

export async function createTestBadge(overrides: Partial<{
  id: string
  name: string
  category: 'milestone' | 'engagement' | 'collaboration' | 'competency'
}> = {}) {
  const db = getTestDb()
  const id = overrides.id || uuidv4()
  const now = new Date()

  const badge = {
    id,
    name: overrides.name || `Test Badge ${id.substring(0, 8)}`,
    description: 'A test badge',
    icon: 'test-badge',
    category: overrides.category || 'milestone',
    criteria: 'Complete a test action',
    criteriaType: 'artifact_count',
    criteriaValue: 1,
    xpReward: 50,
    isActive: true,
    createdAt: now,
  }

  await db.insert(schema.badges).values(badge)
  return badge
}
