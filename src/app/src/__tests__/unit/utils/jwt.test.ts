/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  extractBearerToken,
} from '@/server/auth/jwt'

describe('JWT utilities', () => {
  const testPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: ['explorer'] as ('explorer' | 'creator' | 'admin')[],
  }

  describe('generateAccessToken', () => {
    it('should generate a valid access token', async () => {
      const { token, expiresAt } = await generateAccessToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT format: header.payload.signature
      expect(expiresAt).toBeInstanceOf(Date)
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should set expiration to ~15 minutes', async () => {
      const { expiresAt } = await generateAccessToken(testPayload)

      const fifteenMinutes = 15 * 60 * 1000
      const diff = expiresAt.getTime() - Date.now()

      expect(diff).toBeLessThanOrEqual(fifteenMinutes + 1000) // Allow 1s tolerance
      expect(diff).toBeGreaterThan(fifteenMinutes - 1000)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', async () => {
      const { token, expiresAt } = await generateRefreshToken({
        ...testPayload,
        sessionId: 'test-session-id',
      })

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(expiresAt).toBeInstanceOf(Date)
    })

    it('should set expiration to ~7 days', async () => {
      const { expiresAt } = await generateRefreshToken({
        ...testPayload,
        sessionId: 'test-session-id',
      })

      const sevenDays = 7 * 24 * 60 * 60 * 1000
      const diff = expiresAt.getTime() - Date.now()

      expect(diff).toBeLessThanOrEqual(sevenDays + 1000)
      expect(diff).toBeGreaterThan(sevenDays - 1000)
    })
  })

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      const result = await generateTokenPair(testPayload)

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.accessTokenExpiresAt).toBeInstanceOf(Date)
      expect(result.refreshTokenExpiresAt).toBeInstanceOf(Date)
      expect(result.sessionId).toBeDefined()
    })

    it('should generate unique session IDs', async () => {
      const result1 = await generateTokenPair(testPayload)
      const result2 = await generateTokenPair(testPayload)

      expect(result1.sessionId).not.toBe(result2.sessionId)
    })
  })

  describe('verifyToken', () => {
    it('should verify a valid access token', async () => {
      const { token } = await generateAccessToken(testPayload)
      const payload = await verifyToken(token)

      expect(payload).not.toBeNull()
      expect(payload?.sub).toBe(testPayload.userId)
      expect(payload?.email).toBe(testPayload.email)
      expect(payload?.role).toEqual(testPayload.role)
      expect(payload?.type).toBe('access')
    })

    it('should return null for invalid token', async () => {
      const payload = await verifyToken('invalid-token')
      expect(payload).toBeNull()
    })

    it('should return null for tampered token', async () => {
      const { token } = await generateAccessToken(testPayload)
      const tamperedToken = token.slice(0, -5) + 'xxxxx'
      const payload = await verifyToken(tamperedToken)

      expect(payload).toBeNull()
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify an access token', async () => {
      const { token } = await generateAccessToken(testPayload)
      const payload = await verifyAccessToken(token)

      expect(payload).not.toBeNull()
      expect(payload?.type).toBe('access')
    })

    it('should reject a refresh token', async () => {
      const { token } = await generateRefreshToken({
        ...testPayload,
        sessionId: 'test-session',
      })
      const payload = await verifyAccessToken(token)

      expect(payload).toBeNull()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a refresh token', async () => {
      const { token } = await generateRefreshToken({
        ...testPayload,
        sessionId: 'test-session',
      })
      const payload = await verifyRefreshToken(token)

      expect(payload).not.toBeNull()
      expect(payload?.type).toBe('refresh')
      expect(payload?.sessionId).toBe('test-session')
    })

    it('should reject an access token', async () => {
      const { token } = await generateAccessToken(testPayload)
      const payload = await verifyRefreshToken(token)

      expect(payload).toBeNull()
    })
  })

  describe('generatePasswordResetToken', () => {
    it('should generate a reset token', () => {
      const { token, expiresAt } = generatePasswordResetToken()

      expect(token).toBeDefined()
      expect(token.length).toBe(72) // Two UUIDs concatenated
      expect(expiresAt).toBeInstanceOf(Date)
    })

    it('should set expiration to ~1 hour', () => {
      const { expiresAt } = generatePasswordResetToken()

      const oneHour = 60 * 60 * 1000
      const diff = expiresAt.getTime() - Date.now()

      expect(diff).toBeLessThanOrEqual(oneHour + 1000)
      expect(diff).toBeGreaterThan(oneHour - 1000)
    })

    it('should generate unique tokens', () => {
      const token1 = generatePasswordResetToken().token
      const token2 = generatePasswordResetToken().token

      expect(token1).not.toBe(token2)
    })
  })

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractBearerToken('Bearer my-jwt-token')
      expect(token).toBe('my-jwt-token')
    })

    it('should return null for missing header', () => {
      const token = extractBearerToken(null)
      expect(token).toBeNull()
    })

    it('should return null for non-Bearer header', () => {
      const token = extractBearerToken('Basic credentials')
      expect(token).toBeNull()
    })

    it('should return empty string for malformed Bearer header', () => {
      const token = extractBearerToken('Bearer ')
      expect(token).toBe('')
    })

    it('should handle token with spaces', () => {
      const token = extractBearerToken('Bearer token-with-no-spaces')
      expect(token).toBe('token-with-no-spaces')
    })
  })
})
