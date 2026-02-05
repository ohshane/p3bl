import { Page, expect } from '@playwright/test'

/**
 * Test user credentials - all demo users use the same password
 */
export const TEST_PASSWORD = 'supersecret!'

/**
 * Test user accounts available in the seeded database
 */
export const TEST_USERS = {
  // Explorers
  explorer1: {
    email: 'explorer1@p3bl.local',
    password: TEST_PASSWORD,
    role: 'explorer' as const,
    name: 'Explorer One',
    description: 'Explorer user',
  },
  explorer2: {
    email: 'explorer2@p3bl.local',
    password: TEST_PASSWORD,
    role: 'explorer' as const,
    name: 'Explorer Two',
    description: 'Explorer user',
  },
  explorer3: {
    email: 'explorer3@p3bl.local',
    password: TEST_PASSWORD,
    role: 'explorer' as const,
    name: 'Explorer Three',
    description: 'Explorer user',
  },
  // Creators
  creator1: {
    email: 'creator1@p3bl.local',
    password: TEST_PASSWORD,
    role: 'creator' as const,
    name: 'Creator One',
    description: 'Creator user',
  },
  creator2: {
    email: 'creator2@p3bl.local',
    password: TEST_PASSWORD,
    role: 'creator' as const,
    name: 'Creator Two',
    description: 'Creator user',
  },
  creator3: {
    email: 'creator3@p3bl.local',
    password: TEST_PASSWORD,
    role: 'creator' as const,
    name: 'Creator Three',
    description: 'Creator user',
  },
  // Admin
  admin: {
    email: 'admin@p3bl.local',
    password: TEST_PASSWORD,
    role: 'admin' as const,
    name: 'Admin User',
    description: 'System administrator',
  },
} as const

export type TestUserKey = keyof typeof TEST_USERS

/**
 * Test project join codes
 */
export const TEST_JOIN_CODES = {
  mlFundamentals: 'ML2024',
  webDesign: 'WEB101', // completed project
}

/**
 * Clear auth state by clearing localStorage and reloading
 */
export async function clearAuthState(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.waitForLoadState('networkidle')
}

/**
 * Login using the real login form with email and password
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  // Navigate to login page
  await page.goto('/signin')
  await page.waitForLoadState('networkidle')

  // Fill in login form
  const emailInput = page.locator('input#email')
  const passwordInput = page.locator('input#password')
  const submitButton = page.locator('button[type="submit"]')

  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(email)
  await passwordInput.fill(password)
  await submitButton.click()

  // Wait for navigation away from login page
  try {
    await page.waitForURL(/\/(explorer|creator|admin)/, { timeout: 15000 })
    return true
  } catch {
    return false
  }
}

/**
 * Login as a specific test user
 */
export async function loginAs(
  page: Page,
  userKey: TestUserKey
): Promise<boolean> {
  const user = TEST_USERS[userKey]
  return login(page, user.email, user.password)
}

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page): Promise<boolean> {
  const success = await loginAs(page, 'admin')
  if (success) {
    // Verify we're on admin dashboard
    await expect(page).toHaveURL(/\/admin/)
  }
  return success
}

/**
 * Login as creator user (creator1 by default)
 */
export async function loginAsCreator(
  page: Page,
  creator: 'creator1' | 'creator2' | 'creator3' = 'creator1'
): Promise<boolean> {
  const success = await loginAs(page, creator)
  if (success) {
    // Verify we're on creator dashboard
    await expect(page).toHaveURL(/\/creator/)
  }
  return success
}

/**
 * Login as explorer user (explorer1 by default)
 */
export async function loginAsExplorer(
  page: Page,
  explorer: 'explorer1' | 'explorer2' | 'explorer3' = 'explorer1'
): Promise<boolean> {
  const success = await loginAs(page, explorer)
  if (success) {
    // Verify we're on explorer dashboard
    await expect(page).toHaveURL(/\/explorer/)
  }
  return success
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  // Click logout button if visible
  const logoutButton = page.locator('button:has-text("Logout")').first()

  if (await logoutButton.isVisible({ timeout: 2000 })) {
    await logoutButton.click()
    await page.waitForURL(/\/(login)?$/, { timeout: 10000 })
  } else {
    // Fallback: clear localStorage and go to home
    await clearAuthState(page)
    await page.goto('/')
  }
}

/**
 * Register a new user account
 */
export async function registerUser(
  page: Page,
  data: { name: string; email: string; password: string }
): Promise<boolean> {
  await page.goto('/signup')
  await page.waitForLoadState('networkidle')

  // Fill registration form
  const nameInput = page.locator('input#name')
  const emailInput = page.locator('input#email')
  const passwordInput = page.locator('input#password')
  const confirmPasswordInput = page.locator('input#confirmPassword')
  const submitButton = page.locator('button[type="submit"]')

  await expect(nameInput).toBeVisible({ timeout: 10000 })
  await nameInput.fill(data.name)
  await emailInput.fill(data.email)
  await passwordInput.fill(data.password)

  // Some forms have confirm password
  if (await confirmPasswordInput.isVisible({ timeout: 1000 })) {
    await confirmPasswordInput.fill(data.password)
  }

  await submitButton.click()

  // Wait for redirect to explorer (new users are explorers)
  try {
    await page.waitForURL(/\/explorer/, { timeout: 15000 })
    return true
  } catch {
    return false
  }
}

/**
 * Verify user is authenticated and has expected role
 */
export async function verifyAuthenticated(
  page: Page,
  expectedRole?: 'admin' | 'creator' | 'explorer' | 'pioneer'
): Promise<boolean> {
  // Check we're not on login page
  const url = page.url()
  if (url.includes('/signin') || url.endsWith('/')) {
    return false
  }

  // Check role-specific route if expected
  if (expectedRole) {
    switch (expectedRole) {
      case 'admin':
        return url.includes('/admin')
      case 'creator':
        return url.includes('/creator')
      case 'pioneer':
        return url.includes('/creator')
      case 'explorer':
        return url.includes('/explorer') || url.includes('/activity') || url.includes('/portfolio')
    }
  }

  return true
}

/**
 * Wait for page to be fully loaded after navigation
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  // Wait for any loading spinners to disappear
  const spinner = page.locator('.animate-spin, [data-loading="true"]')
  if (await spinner.isVisible({ timeout: 500 })) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 })
  }
}
