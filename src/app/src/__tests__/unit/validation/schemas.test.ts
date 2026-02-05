/**
 * Additional validation schema tests covering edge cases
 */
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Recreate the schemas locally for testing edge cases
// (This tests the patterns used in the actual validation)

describe('Zod Validation Patterns', () => {
  describe('Email validation', () => {
    const emailSchema = z.string().email()

    it('should accept standard emails', () => {
      expect(emailSchema.safeParse('user@example.com').success).toBe(true)
      expect(emailSchema.safeParse('user.name@example.com').success).toBe(true)
      expect(emailSchema.safeParse('user+tag@example.com').success).toBe(true)
    })

    it('should accept emails with subdomains', () => {
      expect(emailSchema.safeParse('user@mail.example.com').success).toBe(true)
      expect(emailSchema.safeParse('user@sub.domain.example.co.uk').success).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(emailSchema.safeParse('notanemail').success).toBe(false)
      expect(emailSchema.safeParse('@example.com').success).toBe(false)
      expect(emailSchema.safeParse('user@').success).toBe(false)
      expect(emailSchema.safeParse('user@.com').success).toBe(false)
    })

    it('should reject empty string', () => {
      expect(emailSchema.safeParse('').success).toBe(false)
    })
  })

  describe('Password validation pattern', () => {
    const passwordSchema = z
      .string()
      .min(8)
      .max(128)
      .regex(/[a-z]/, 'lowercase')
      .regex(/[A-Z]/, 'uppercase')
      .regex(/[0-9]/, 'number')

    it('should accept valid passwords', () => {
      expect(passwordSchema.safeParse('Password123').success).toBe(true)
      expect(passwordSchema.safeParse('MyP@ssword1').success).toBe(true)
      expect(passwordSchema.safeParse('C0mplexP@ss!').success).toBe(true)
    })

    it('should accept passwords with special characters', () => {
      expect(passwordSchema.safeParse('Pass123!@#$%').success).toBe(true)
      expect(passwordSchema.safeParse('Test_Pass_1').success).toBe(true)
    })

    it('should accept exactly 8 character passwords', () => {
      expect(passwordSchema.safeParse('Pass123a').success).toBe(true)
    })

    it('should accept exactly 128 character passwords', () => {
      const longPass = 'A' + 'a'.repeat(125) + '12'
      expect(passwordSchema.safeParse(longPass).success).toBe(true)
    })

    it('should reject short passwords', () => {
      expect(passwordSchema.safeParse('Pass1').success).toBe(false)
      expect(passwordSchema.safeParse('Aa1').success).toBe(false)
    })

    it('should reject passwords longer than 128', () => {
      const tooLong = 'A' + 'a'.repeat(127) + '12'
      expect(passwordSchema.safeParse(tooLong).success).toBe(false)
    })

    it('should reject all lowercase', () => {
      expect(passwordSchema.safeParse('password123').success).toBe(false)
    })

    it('should reject all uppercase', () => {
      expect(passwordSchema.safeParse('PASSWORD123').success).toBe(false)
    })

    it('should reject no numbers', () => {
      expect(passwordSchema.safeParse('PasswordABC').success).toBe(false)
    })

    it('should handle unicode characters with latin letters', () => {
      // Unicode doesn't count for [a-z] regex, only ASCII lowercase
      expect(passwordSchema.safeParse('ПАРОЛЬ123Ab').success).toBe(true) // Has 'A' and 'b'
      expect(passwordSchema.safeParse('PASSWORD123').success).toBe(false) // No lowercase
    })
  })

  describe('Name validation pattern', () => {
    const nameSchema = z.string().min(2).max(100)

    it('should accept valid names', () => {
      expect(nameSchema.safeParse('John').success).toBe(true)
      expect(nameSchema.safeParse('John Doe').success).toBe(true)
      expect(nameSchema.safeParse('Mary Jane Watson').success).toBe(true)
    })

    it('should accept names with special characters', () => {
      expect(nameSchema.safeParse("O'Brien").success).toBe(true)
      expect(nameSchema.safeParse('García').success).toBe(true)
      expect(nameSchema.safeParse('Müller').success).toBe(true)
    })

    it('should accept exactly 2 character names', () => {
      expect(nameSchema.safeParse('Bo').success).toBe(true)
    })

    it('should accept exactly 100 character names', () => {
      expect(nameSchema.safeParse('A'.repeat(100)).success).toBe(true)
    })

    it('should reject single character names', () => {
      expect(nameSchema.safeParse('A').success).toBe(false)
    })

    it('should reject names longer than 100 characters', () => {
      expect(nameSchema.safeParse('A'.repeat(101)).success).toBe(false)
    })

    it('should reject empty names', () => {
      expect(nameSchema.safeParse('').success).toBe(false)
    })
  })

  describe('URL validation pattern', () => {
    const urlSchema = z.string().url().optional().nullable()

    it('should accept valid URLs', () => {
      expect(urlSchema.safeParse('https://example.com').success).toBe(true)
      expect(urlSchema.safeParse('http://example.com').success).toBe(true)
      expect(urlSchema.safeParse('https://example.com/path/to/resource').success).toBe(true)
    })

    it('should accept URLs with query parameters', () => {
      expect(urlSchema.safeParse('https://example.com?query=value').success).toBe(true)
      expect(urlSchema.safeParse('https://example.com?a=1&b=2').success).toBe(true)
    })

    it('should accept URLs with fragments', () => {
      expect(urlSchema.safeParse('https://example.com#section').success).toBe(true)
    })

    it('should accept optional (undefined)', () => {
      expect(urlSchema.safeParse(undefined).success).toBe(true)
    })

    it('should accept null', () => {
      expect(urlSchema.safeParse(null).success).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(urlSchema.safeParse('not-a-url').success).toBe(false)
      expect(urlSchema.safeParse('example.com').success).toBe(false) // Missing protocol
      expect(urlSchema.safeParse('ftp://example.com').success).toBe(true) // FTP is valid URL
    })
  })

  describe('Enum validation pattern', () => {
    const roleSchema = z.enum(['explorer', 'creator'])

    it('should accept valid enum values', () => {
      expect(roleSchema.safeParse('explorer').success).toBe(true)
      expect(roleSchema.safeParse('creator').success).toBe(true)
    })

    it('should reject invalid enum values', () => {
      expect(roleSchema.safeParse('admin').success).toBe(false)
      expect(roleSchema.safeParse('user').success).toBe(false)
      expect(roleSchema.safeParse('EXPLORER').success).toBe(false) // Case sensitive
    })

    it('should reject empty string', () => {
      expect(roleSchema.safeParse('').success).toBe(false)
    })

    it('should reject non-strings', () => {
      expect(roleSchema.safeParse(1).success).toBe(false)
      expect(roleSchema.safeParse(null).success).toBe(false)
      expect(roleSchema.safeParse(undefined).success).toBe(false)
    })
  })

  describe('Integer validation pattern', () => {
    const intSchema = z.number().int().min(1).max(100)

    it('should accept valid integers', () => {
      expect(intSchema.safeParse(1).success).toBe(true)
      expect(intSchema.safeParse(50).success).toBe(true)
      expect(intSchema.safeParse(100).success).toBe(true)
    })

    it('should reject floats', () => {
      expect(intSchema.safeParse(1.5).success).toBe(false)
      expect(intSchema.safeParse(99.9).success).toBe(false)
    })

    it('should reject below minimum', () => {
      expect(intSchema.safeParse(0).success).toBe(false)
      expect(intSchema.safeParse(-1).success).toBe(false)
    })

    it('should reject above maximum', () => {
      expect(intSchema.safeParse(101).success).toBe(false)
      expect(intSchema.safeParse(1000).success).toBe(false)
    })

    it('should reject non-numbers', () => {
      expect(intSchema.safeParse('5').success).toBe(false)
      expect(intSchema.safeParse(null).success).toBe(false)
    })
  })

  describe('Default value pattern', () => {
    const schemaWithDefault = z.object({
      name: z.string(),
      role: z.enum(['explorer', 'creator']).default('explorer'),
      active: z.boolean().default(true),
    })

    it('should apply default values', () => {
      const result = schemaWithDefault.parse({ name: 'Test' })
      expect(result.role).toBe('explorer')
      expect(result.active).toBe(true)
    })

    it('should allow overriding defaults', () => {
      const result = schemaWithDefault.parse({ name: 'Test', role: 'creator', active: false })
      expect(result.role).toBe('creator')
      expect(result.active).toBe(false)
    })
  })

  describe('Optional fields pattern', () => {
    const schemaWithOptional = z.object({
      required: z.string(),
      optional: z.string().optional(),
      nullable: z.string().nullable(),
    })

    it('should accept when optional is omitted', () => {
      const result = schemaWithOptional.safeParse({
        required: 'value',
        nullable: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept when optional is provided', () => {
      const result = schemaWithOptional.safeParse({
        required: 'value',
        optional: 'also value',
        nullable: 'not null',
      })
      expect(result.success).toBe(true)
    })

    it('should accept null for nullable fields', () => {
      const result = schemaWithOptional.safeParse({
        required: 'value',
        nullable: null,
      })
      expect(result.success).toBe(true)
    })

    it('should reject null for optional (not nullable) fields', () => {
      const result = schemaWithOptional.safeParse({
        required: 'value',
        optional: null as any,
        nullable: null,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('Array validation pattern', () => {
    const arraySchema = z.array(z.string()).min(1).max(10)

    it('should accept valid arrays', () => {
      expect(arraySchema.safeParse(['one']).success).toBe(true)
      expect(arraySchema.safeParse(['one', 'two', 'three']).success).toBe(true)
    })

    it('should reject empty arrays', () => {
      expect(arraySchema.safeParse([]).success).toBe(false)
    })

    it('should reject arrays exceeding max', () => {
      const tooMany = Array(11).fill('item')
      expect(arraySchema.safeParse(tooMany).success).toBe(false)
    })

    it('should reject arrays with wrong element types', () => {
      expect(arraySchema.safeParse([1, 2, 3]).success).toBe(false)
      expect(arraySchema.safeParse(['valid', 123, 'mixed']).success).toBe(false)
    })
  })

  describe('Object with transformations', () => {
    const transformSchema = z.object({
      email: z.string().email().transform(v => v.toLowerCase()),
      code: z.string().transform(v => v.toUpperCase().trim()),
    })

    it('should transform email to lowercase', () => {
      const result = transformSchema.parse({ email: 'USER@EXAMPLE.COM', code: 'abc' })
      expect(result.email).toBe('user@example.com')
    })

    it('should transform code to uppercase and trim', () => {
      const result = transformSchema.parse({ email: 'user@example.com', code: '  abc123  ' })
      expect(result.code).toBe('ABC123')
    })
  })

  describe('Refinement validation', () => {
    const passwordConfirmSchema = z
      .object({
        password: z.string().min(8),
        confirmPassword: z.string(),
      })
      .refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
      })

    it('should accept matching passwords', () => {
      const result = passwordConfirmSchema.safeParse({
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject non-matching passwords', () => {
      const result = passwordConfirmSchema.safeParse({
        password: 'Password123',
        confirmPassword: 'Different123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword')
      }
    })
  })
})
