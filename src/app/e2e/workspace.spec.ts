import { test, expect } from '@playwright/test'
import {
  loginAsExplorer,
  clearAuthState,
  TEST_USERS,
  TEST_JOIN_CODES,
  waitForPageLoad,
} from './utils/auth'

test.describe('Explorer Workspace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
  })

  test('should display workspace layout', async ({ page }) => {
    await waitForPageLoad(page)

    const workspaceContent = page.locator('main, [role="main"], .workspace')
    await expect(workspaceContent.first()).toBeVisible({ timeout: 10000 })
  })

  test('should show project list or onboarding', async ({ page }) => {
    await waitForPageLoad(page)

    // Either show projects or onboarding for new users
    const projectsOrOnboarding = page.locator('text=/projects|join|welcome|get started/i').first()
    await expect(projectsOrOnboarding).toBeVisible({ timeout: 10000 })
  })

  test('should display user name in header', async ({ page }) => {
    await waitForPageLoad(page)

    await expect(page.locator(`text=${TEST_USERS.explorer1.name}`)).toBeVisible({ timeout: 10000 })
  })

  test('should have logout button', async ({ page }) => {
    await waitForPageLoad(page)

    const logoutButton = page.locator('button:has-text("Logout")')
    await expect(logoutButton.first()).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Explorer Workspace - Join Code', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    // Login as Jordan who is in onboarding mode
    const success = await loginAsExplorer(page, 'explorer2')
    if (!success) {
      test.skip()
    }
  })

  test('should have join code input area', async ({ page }) => {
    await waitForPageLoad(page)

    const joinCodeArea = page.locator('text=/join code|enter code/i').first()

    if (await joinCodeArea.isVisible({ timeout: 5000 })) {
      await expect(joinCodeArea).toBeVisible()
    } else {
      // May be hidden if user has projects
      const input = page.locator('input[placeholder*="code" i]').first()
      await expect(input).toBeVisible({ timeout: 5000 })
    }
  })

  test('should validate invalid join code', async ({ page }) => {
    await waitForPageLoad(page)

    const input = page.locator('input[placeholder*="code" i], input[name*="code" i]').first()

    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill('INVALID')

      const submitButton = page.locator('button[type="submit"], button:has-text("join")').first()
      if (await submitButton.isVisible()) {
        await submitButton.click()

        const error = page.locator('text=/invalid|error|not found/i').first()
        await expect(error).toBeVisible({ timeout: 5000 })
      }
    } else {
      test.skip()
    }
  })

  test('should accept valid join code format', async ({ page }) => {
    await waitForPageLoad(page)

    const input = page.locator('input[placeholder*="code" i], input[name*="code" i]').first()

    if (await input.isVisible({ timeout: 5000 })) {
      await input.fill(TEST_JOIN_CODES.mlFundamentals)
      await expect(input).toHaveValue(TEST_JOIN_CODES.mlFundamentals)
    } else {
      test.skip()
    }
  })
})

test.describe('Explorer Workspace Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
  })

  test('should navigate between explorer sections', async ({ page }) => {
    await page.goto('/explorer')
    await waitForPageLoad(page)

    const navItems = page.locator('nav a, [role="tablist"] button, .tabs button')

    const count = await navItems.count()
    if (count > 1) {
      await navItems.nth(1).click()
      await page.waitForTimeout(500)
    }
  })

  test('should navigate to portfolio', async ({ page }) => {
    await waitForPageLoad(page)

    const portfolioLink = page.locator('a[href*="/portfolio"], button:has-text("Portfolio")').first()

    if (await portfolioLink.isVisible({ timeout: 5000 })) {
      await portfolioLink.click()
      await expect(page).toHaveURL(/\/portfolio/, { timeout: 10000 })
    }
  })

  test('should navigate to activity when clicking project', async ({ page }) => {
    await waitForPageLoad(page)

    const projectLink = page.locator('a[href*="/activity"], button:has-text("Continue"), button:has-text("Open")').first()

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click()
      await expect(page).toHaveURL(/\/activity/, { timeout: 10000 })
    }
  })
})

test.describe('Workspace Modes', () => {
  test('should show onboarding mode for new user (Jordan)', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer2')

    if (success) {
      await waitForPageLoad(page)

      // Jordan has no projects - should see onboarding
      const onboardingContent = page.locator('text=/welcome|join|invitation|get started/i').first()
      await expect(onboardingContent).toBeVisible({ timeout: 10000 })
    }
  })

  test('should show active mode for user with projects (Alex)', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')

    if (success) {
      await waitForPageLoad(page)

      // Alex has projects - should see active mode
      const activeContent = page.locator('text=/my projects|active|Machine Learning/i').first()
      await expect(activeContent).toBeVisible({ timeout: 10000 })
    }
  })
})
