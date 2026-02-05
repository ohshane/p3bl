import { test, expect } from '@playwright/test'
import {
  loginAsAdmin,
  loginAsCreator,
  loginAsExplorer,
  logout,
  clearAuthState,
  TEST_USERS,
  waitForPageLoad,
} from './utils/auth'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
  })

  test('should display landing page with login options', async ({ page }) => {
    await expect(page).toHaveTitle(/P3BL|Project Based Learning/)

    // Should have Sign In and Get Started buttons
    await expect(page.locator('a:has-text("Sign In"), button:has-text("Sign In")').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first()).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    const signInButton = page.locator('a:has-text("Sign In")').first()
    await signInButton.click()

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible()
  })

  test('should navigate to registration page', async ({ page }) => {
    const getStartedButton = page.locator('a:has-text("Get Started")').first()
    await getStartedButton.click()

    await expect(page).toHaveURL(/\/register/, { timeout: 10000 })
    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible()
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/signin')

    await expect(page.locator('input#email')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should allow explorer login', async ({ page }) => {
    const success = await loginAsExplorer(page, 'explorer1')
    expect(success).toBe(true)

    await expect(page).toHaveURL(/\/explorer/, { timeout: 15000 })
    await expect(page.locator('text=/projects|explorer|dashboard/i').first()).toBeVisible({ timeout: 15000 })
  })

  test('should allow creator login', async ({ page }) => {
    const success = await loginAsCreator(page)
    expect(success).toBe(true)

    await expect(page).toHaveURL(/\/creator/, { timeout: 15000 })
    await expect(page.locator('text=/dashboard|projects|create/i').first()).toBeVisible({ timeout: 15000 })
  })

  test('should allow admin login', async ({ page }) => {
    const success = await loginAsAdmin(page)
    expect(success).toBe(true)

    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    await expect(page.locator('text=/admin|dashboard|users/i').first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Login Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
  })

  test('should show error for empty email', async ({ page }) => {
    await page.locator('input#password').fill('somepassword')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=/required|enter|email/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show error for empty password', async ({ page }) => {
    await page.locator('input#email').fill('test@example.com')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=/required|enter|password/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.locator('input#email').fill('wrong@example.com')
    await page.locator('input#password').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=/invalid|error|incorrect/i').first()).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show/hide password toggle', async ({ page }) => {
    const passwordInput = page.locator('input#password')
    const toggleButton = page.locator('button').filter({ has: page.locator('[class*="Eye"]') }).first()

    // Initially password type
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle
    if (await toggleButton.isVisible({ timeout: 2000 })) {
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')

      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    }
  })
})

test.describe('Registration Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('input#name, input[name="name"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input#email, input[name="email"]')).toBeVisible()
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error for empty name', async ({ page }) => {
    await page.locator('input#email, input[name="email"]').fill('test@example.com')
    await page.locator('input#password, input[name="password"]').fill('Password123!')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=/required|name/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.locator('input#name, input[name="name"]').fill('Test User')
    await page.locator('input#email, input[name="email"]').fill('invalid-email')
    await page.locator('input#password, input[name="password"]').fill('Password123!')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=/email|invalid|format/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show error for weak password', async ({ page }) => {
    await page.locator('input#name, input[name="name"]').fill('Test User')
    await page.locator('input#email, input[name="email"]').fill('test@example.com')
    await page.locator('input#password, input[name="password"]').fill('weak')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=/password|character|strong|weak/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.locator('a:has-text("Sign in")')
    await expect(loginLink).toBeVisible({ timeout: 10000 })

    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Role-Based Redirects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
  })

  test('should redirect admin to /admin after login', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.admin.email)
    await page.locator('input#password').fill(TEST_USERS.admin.password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
  })

  test('should redirect creator to /creator after login', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.creator1.email)
    await page.locator('input#password').fill(TEST_USERS.creator1.password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/creator/, { timeout: 15000 })
  })

  test('should redirect explorer to /explorer after login', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.explorer1.email)
    await page.locator('input#password').fill(TEST_USERS.explorer1.password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/explorer/, { timeout: 15000 })
  })

  test('should redirect unauthenticated from /explorer to /login', async ({ page }) => {
    await page.goto('/explorer')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('should redirect unauthenticated from /creator to /login', async ({ page }) => {
    await page.goto('/creator')
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })

  test('should redirect unauthenticated from /admin to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

test.describe('Logout Flow', () => {
  test('should logout explorer successfully', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsExplorer(page, 'explorer1')

    await logout(page)

    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })

  test('should logout creator successfully', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsCreator(page)

    await logout(page)

    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })

  test('should logout admin successfully', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsAdmin(page)

    await logout(page)

    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })

  test('should not access protected routes after logout', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsExplorer(page, 'explorer1')
    await logout(page)

    // Try to access protected route
    await page.goto('/explorer')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

test.describe('Session Persistence', () => {
  test('should stay logged in after page reload', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsExplorer(page, 'explorer1')

    // Reload page
    await page.reload()
    await waitForPageLoad(page)

    // Should still be on explorer (authenticated)
    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })

  test('should redirect authenticated user from /login to dashboard', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsExplorer(page, 'explorer1')

    // Try to access login page while authenticated
    await page.goto('/signin')

    // Should be redirected to explorer
    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })

  test('should redirect authenticated user from landing to dashboard', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsExplorer(page, 'explorer1')

    // Go to landing page
    await page.goto('/')

    // Should be redirected to explorer
    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })
})
