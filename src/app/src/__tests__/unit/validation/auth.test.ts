import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  updateProfileSchema,
} from '@/server/validation/auth'

describe('Auth validation schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User',
        role: 'explorer',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'ValidPass123',
        name: 'Test User',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const data = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject password without uppercase', () => {
      const data = {
        email: 'test@example.com',
        password: 'alllowercase123',
        name: 'Test User',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject too short name', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'A',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should default role to explorer', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('explorer')
      }
    })

    it('should accept creator role', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User',
        role: 'creator',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('creator')
      }
    })

    it('should reject invalid role', () => {
      const data = {
        email: 'test@example.com',
        password: 'ValidPass123',
        name: 'Test User',
        role: 'superadmin',
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'anypassword',
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = {
        email: 'not-valid',
        password: 'anypassword',
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const data = {
        email: 'test@example.com',
        password: '',
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('passwordResetRequestSchema', () => {
    it('should accept valid email', () => {
      const data = { email: 'test@example.com' }

      const result = passwordResetRequestSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const data = { email: 'not-an-email' }

      const result = passwordResetRequestSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('passwordResetSchema', () => {
    it('should accept valid reset data', () => {
      const data = {
        token: 'valid-token-string',
        password: 'NewValidPass123',
      }

      const result = passwordResetSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty token', () => {
      const data = {
        token: '',
        password: 'NewValidPass123',
      }

      const result = passwordResetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject weak new password', () => {
      const data = {
        token: 'valid-token',
        password: 'weak',
      }

      const result = passwordResetSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    it('should accept valid password change', () => {
      const data = {
        currentPassword: 'anything',
        newPassword: 'NewValidPass123',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject empty current password', () => {
      const data = {
        currentPassword: '',
        newPassword: 'NewValidPass123',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject weak new password', () => {
      const data = {
        currentPassword: 'anything',
        newPassword: 'weak',
      }

      const result = changePasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('updateProfileSchema', () => {
    it('should accept valid profile update', () => {
      const data = {
        name: 'New Name',
        avatarUrl: 'https://example.com/avatar.jpg',
        hallOfFameOptIn: true,
      }

      const result = updateProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept empty object (all optional)', () => {
      const data = {}

      const result = updateProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept partial updates', () => {
      const data = { name: 'Just Name' }

      const result = updateProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject too short name', () => {
      const data = { name: 'A' }

      const result = updateProfileSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid avatar URL', () => {
      const data = { avatarUrl: 'not-a-url' }

      const result = updateProfileSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should accept null avatar URL', () => {
      const data = { avatarUrl: null }

      const result = updateProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })
})
