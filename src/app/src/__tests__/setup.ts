import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
process.env.DATABASE_URL = ':memory:'

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})

// Global test setup
beforeAll(() => {
  // Add any global setup here
})

// Global test teardown
afterAll(() => {
  // Add any global teardown here
})
