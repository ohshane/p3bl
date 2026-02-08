/**
 * @vitest-environment node
 *
 * Integration tests for auth API functions
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import {
  setupTestDb,
  closeTestDb,
  clearTestDb,
  createTestUser,
  getTestDb,
} from '../setup'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword, generateTokenPair, verifyAccessToken, verifyRefreshToken } from '@/server/auth'

describe('Auth API', () => {
  beforeAll(() => {
    setupTestDb()
  })

  afterAll(() => {
    closeTestDb()
  })

  beforeEach(() => {
    clearTestDb()
  })

  describe('Password Hashing', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'SecurePassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(await verifyPassword(password, hash)).toBe(true)
      expect(await verifyPassword('WrongPassword', hash)).toBe(false)
    })

    it('should generate unique hashes for same password', async () => {
      const password = 'SecurePassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
      // Both should still verify
      expect(await verifyPassword(password, hash1)).toBe(true)
      expect(await verifyPassword(password, hash2)).toBe(true)
    })
  })

  describe('JWT Tokens', () => {
    it('should generate and verify access token', async () => {
      const tokenData = await generateTokenPair({
        userId: 'test-user-id',
        email: 'test@example.com',
        role: ['explorer'],
      })

      expect(tokenData.accessToken).toBeDefined()
      expect(tokenData.refreshToken).toBeDefined()
      expect(tokenData.sessionId).toBeDefined()

      const payload = await verifyAccessToken(tokenData.accessToken)
      expect(payload).toBeDefined()
      expect(payload?.sub).toBe('test-user-id')
      expect(payload?.email).toBe('test@example.com')
      expect(payload?.role).toEqual(['explorer'])
    })

    it('should generate and verify refresh token', async () => {
      const tokenData = await generateTokenPair({
        userId: 'test-user-id',
        email: 'test@example.com',
        role: ['explorer'],
      })

      const payload = await verifyRefreshToken(tokenData.refreshToken)
      expect(payload).toBeDefined()
      expect(payload?.sub).toBe('test-user-id')
      expect(payload?.sessionId).toBe(tokenData.sessionId)
    })

    it('should reject invalid tokens', async () => {
      const payload = await verifyAccessToken('invalid-token')
      expect(payload).toBeNull()
    })
  })

  describe('User Registration', () => {
    it('should create user with hashed password', async () => {
      const db = getTestDb()
      const user = await createTestUser({
        email: 'newuser@example.com',
        password: 'MySecurePass123!',
        name: 'New User',
        role: '["explorer"]',
      })

      const dbUser = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email),
      })

      expect(dbUser).toBeDefined()
      expect(dbUser!.email).toBe(user.email)
      expect(dbUser!.name).toBe(user.name)
      expect(dbUser!.role).toBe(user.role)
      // Password should be hashed
      expect(dbUser!.passwordHash).not.toBe(user.password)
      expect(await verifyPassword(user.password, dbUser!.passwordHash)).toBe(true)
    })

    it('should set default XP and level for new users', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      const dbUser = await db.query.users.findFirst({
        where: eq(schema.users.id, user.id),
      })

      expect(dbUser!.xp).toBe(0)
      expect(dbUser!.level).toBe(1)
    })
  })

  describe('Auth Sessions', () => {
    it('should create and retrieve auth session', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      const tokenData = await generateTokenPair({
        userId: user.id,
        email: user.email,
        role: JSON.parse(user.role),
      })

      // Store session
      await db.insert(schema.authSessions).values({
        id: tokenData.sessionId,
        userId: user.id,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.refreshTokenExpiresAt,
        createdAt: new Date(),
      })

      // Retrieve session
      const session = await db.query.authSessions.findFirst({
        where: eq(schema.authSessions.id, tokenData.sessionId),
      })

      expect(session).toBeDefined()
      expect(session!.userId).toBe(user.id)
      expect(session!.refreshToken).toBe(tokenData.refreshToken)
    })

    it('should delete session on logout', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      const tokenData = await generateTokenPair({
        userId: user.id,
        email: user.email,
        role: JSON.parse(user.role),
      })

      await db.insert(schema.authSessions).values({
        id: tokenData.sessionId,
        userId: user.id,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.refreshTokenExpiresAt,
        createdAt: new Date(),
      })

      // Delete session (logout)
      await db.delete(schema.authSessions)
        .where(eq(schema.authSessions.refreshToken, tokenData.refreshToken))

      const session = await db.query.authSessions.findFirst({
        where: eq(schema.authSessions.id, tokenData.sessionId),
      })

      expect(session).toBeUndefined()
    })

    it('should delete all user sessions on logoutAll', async () => {
      const db = getTestDb()
      const user = await createTestUser()

      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        const tokenData = await generateTokenPair({
          userId: user.id,
          email: user.email,
          role: JSON.parse(user.role),
        })

        await db.insert(schema.authSessions).values({
          id: tokenData.sessionId,
          userId: user.id,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.refreshTokenExpiresAt,
          createdAt: new Date(),
        })
      }

      // Verify 3 sessions exist
      const sessionsBefore = await db.query.authSessions.findMany({
        where: eq(schema.authSessions.userId, user.id),
      })
      expect(sessionsBefore).toHaveLength(3)

      // Logout all
      await db.delete(schema.authSessions)
        .where(eq(schema.authSessions.userId, user.id))

      const sessionsAfter = await db.query.authSessions.findMany({
        where: eq(schema.authSessions.userId, user.id),
      })
      expect(sessionsAfter).toHaveLength(0)
    })
  })

  describe('Password Reset', () => {
    it('should create and use password reset token', async () => {
      const db = getTestDb()
      const user = await createTestUser()
      const resetToken = 'test-reset-token-123'
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Create reset record
      await db.insert(schema.passwordResets).values({
        id: 'reset-1',
        userId: user.id,
        token: resetToken,
        expiresAt,
        createdAt: new Date(),
      })

      // Find valid reset
      const resetRecord = await db.query.passwordResets.findFirst({
        where: eq(schema.passwordResets.token, resetToken),
      })

      expect(resetRecord).toBeDefined()
      expect(resetRecord!.userId).toBe(user.id)
      expect(resetRecord!.usedAt).toBeNull()

      // Mark as used
      await db.update(schema.passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(schema.passwordResets.id, resetRecord!.id))

      const usedRecord = await db.query.passwordResets.findFirst({
        where: eq(schema.passwordResets.token, resetToken),
      })

      expect(usedRecord!.usedAt).not.toBeNull()
    })
  })
})
