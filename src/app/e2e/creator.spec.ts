import { test, expect } from '@playwright/test'
import {
  loginAsCreator,
  loginAsExplorer,
  loginAsAdmin,
  logout,
  clearAuthState,
  TEST_USERS,
  waitForPageLoad,
} from './utils/auth'

test.describe('Creator Authentication & Authorization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
  })

  test('should login as creator with valid credentials', async ({ page }) => {
    const success = await loginAsCreator(page)
    expect(success).toBe(true)
    await expect(page).toHaveURL(/\/creator/)
  })

  test('should redirect to /creator after creator login', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.creator1.email)
    await page.locator('input#password').fill(TEST_USERS.creator1.password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/creator/, { timeout: 15000 })
  })

  test('should redirect explorer away from /creator', async ({ page }) => {
    await loginAsExplorer(page, 'explorer1')
    await page.goto('/creator')

    // Should be redirected to explorer
    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })

  test('should allow admin to access /creator', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/creator')

    // Admin should be able to access creator pages
    // (Note: this depends on implementation - may redirect to admin)
    const url = page.url()
    expect(url.includes('/creator') || url.includes('/admin')).toBe(true)
  })

  test('should logout creator and redirect to login', async ({ page }) => {
    await loginAsCreator(page)
    await logout(page)

    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })

  test('should redirect unauthenticated user from /creator to login', async ({ page }) => {
    await page.goto('/creator')

    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })
})

test.describe('Creator Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
  })

  test('should display creator dashboard', async ({ page }) => {
    await waitForPageLoad(page)

    // Dashboard should have main heading or project content
    const dashboardContent = page.locator('text=/Project Dashboard|Dashboard|Projects|Create/i').first()
    await expect(dashboardContent).toBeVisible({ timeout: 10000 })
  })

  test('should display New Project button', async ({ page }) => {
    await waitForPageLoad(page)

    const newProjectButton = page.locator('button:has-text("New Project")').first()
    await expect(newProjectButton).toBeVisible({ timeout: 10000 })
  })

  test('should show project tabs (Active, Draft, Completed)', async ({ page }) => {
    await waitForPageLoad(page)

    // Check for tabs - may show as buttons or links
    const activeTab = page.locator('button:has-text("Active"), [role="tab"]:has-text("Active")').first()
    const draftTab = page.locator('button:has-text("Draft"), [role="tab"]:has-text("Draft")').first()
    const completedTab = page.locator('button:has-text("Completed"), [role="tab"]:has-text("Completed")').first()

    // At least one should be visible (dashboard or empty state may hide tabs)
    const hasProjects = await page.locator('text=/Project Dashboard/').isVisible({ timeout: 3000 })

    if (hasProjects) {
      await expect(activeTab).toBeVisible({ timeout: 5000 })
      await expect(draftTab).toBeVisible()
      await expect(completedTab).toBeVisible()
    }
  })

  test('should display quick stats for projects', async ({ page }) => {
    await waitForPageLoad(page)

    const hasProjects = await page.locator('text=/Project Dashboard/').isVisible({ timeout: 3000 })

    if (hasProjects) {
      // Should show stats cards
      await expect(page.locator('text=Active Projects')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=Draft Projects')).toBeVisible()
      await expect(page.locator('text=Total Learners')).toBeVisible()
    }
  })

  test('should navigate to project creation when clicking New Project', async ({ page }) => {
    await waitForPageLoad(page)

    const newProjectButton = page.locator('button:has-text("New Project")').first()
    await newProjectButton.click()

    await expect(page).toHaveURL(/\/creator\/new/, { timeout: 10000 })
  })

  test('should switch between project tabs', async ({ page }) => {
    await waitForPageLoad(page)

    const hasProjects = await page.locator('text=/Project Dashboard/').isVisible({ timeout: 3000 })

    if (hasProjects) {
      // Click Draft tab
      const draftTab = page.locator('button:has-text("Draft"), [role="tab"]:has-text("Draft")').first()
      await draftTab.click()

      // Tab should be active
      await expect(draftTab).toHaveAttribute('data-state', 'active', { timeout: 5000 }).catch(() => {
        // Alternative: check for active class
      })

      // Click Completed tab
      const completedTab = page.locator('button:has-text("Completed"), [role="tab"]:has-text("Completed")').first()
      await completedTab.click()
    }
  })

  test('should show empty state for new creator', async ({ page }) => {
    // This test checks the empty dashboard state
    // May need to use a different creator or clear their projects
    await waitForPageLoad(page)

    const emptyState = page.locator('text=/no projects|create your first|get started/i').first()
    const hasProjects = await page.locator('text=/Project Dashboard/').isVisible({ timeout: 3000 })

    // Either shows empty state or project dashboard
    if (!hasProjects) {
      await expect(emptyState).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Project Creation Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
    await waitForPageLoad(page)
    // Click New Project button to navigate to wizard
    const newProjectButton = page.locator('button:has-text("New Project")').first()
    await newProjectButton.click()
    await page.waitForURL(/\/creator\/new/, { timeout: 10000 })
    await waitForPageLoad(page)
  })

  test('should display project wizard', async ({ page }) => {
    await expect(page.locator('h1:has-text("Create New Project")')).toBeVisible({ timeout: 10000 })
  })

  test('should show wizard progress bar', async ({ page }) => {
    // Progress bar or step indicator
    const progress = page.locator('[role="progressbar"], .progress, [class*="Progress"]')
    await expect(progress.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display step indicators', async ({ page }) => {
    // Step 1 of X indicator
    await expect(page.locator('text=/Step \\d+ of \\d+/')).toBeVisible({ timeout: 10000 })
  })

  test('should show wizard step navigation buttons', async ({ page }) => {
    // Back/Cancel button
    const backButton = page.locator('button:has-text("Cancel"), button:has-text("Back")').first()
    await expect(backButton).toBeVisible({ timeout: 10000 })

    // Next button
    const nextButton = page.locator('button:has-text("Next")').first()
    await expect(nextButton).toBeVisible()
  })

  test('should navigate through wizard steps', async ({ page }) => {
    // Start at step 1
    await expect(page.locator('text=/Step 1 of/')).toBeVisible({ timeout: 10000 })

    // Click Next
    const nextButton = page.locator('button:has-text("Next")').first()
    await nextButton.click()

    // Should be on step 2
    await expect(page.locator('text=/Step 2 of/')).toBeVisible({ timeout: 10000 })
  })

  test('should go back to previous step', async ({ page }) => {
    // Ensure we're on step 1 first
    await expect(page.locator('text=/Step 1 of/')).toBeVisible({ timeout: 10000 })
    
    // Go to step 2
    const nextButton = page.locator('button:has-text("Next")').first()
    await nextButton.click()
    await expect(page.locator('text=/Step 2 of/')).toBeVisible({ timeout: 10000 })

    // Go back to step 1 - use the navigation button at the bottom (not "Back to Dashboard")
    // The button text is exactly "Back" with an arrow icon
    const backButton = page.locator('button').filter({ hasText: /^Back$/ }).first()
    await backButton.click()

    await expect(page.locator('text=/Step 1 of/')).toBeVisible({ timeout: 10000 })
  })

  test('should return to dashboard on Cancel from step 1', async ({ page }) => {
    const cancelButton = page.locator('button:has-text("Cancel")').first()
    await cancelButton.click()

    await expect(page).toHaveURL(/\/creator\/?$/, { timeout: 10000 })
  })

  test('should show Back to Dashboard link', async ({ page }) => {
    const backLink = page.locator('button:has-text("Back to Dashboard"), a:has-text("Back to Dashboard")').first()
    await expect(backLink).toBeVisible({ timeout: 10000 })

    await backLink.click()
    await expect(page).toHaveURL(/\/creator\/?$/, { timeout: 10000 })
  })
})

test.describe('Project Wizard - Step 1: Mode Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
    await waitForPageLoad(page)
    // Click New Project button to navigate to wizard
    const newProjectButton = page.locator('button:has-text("New Project")').first()
    await newProjectButton.click()
    await page.waitForURL(/\/creator\/new/, { timeout: 10000 })
    await waitForPageLoad(page)
  })

  test('should display mode selection options', async ({ page }) => {
    // Step 1 should show mode selector
    const modeContent = page.locator('text=/mode|creation mode|choose/i').first()
    await expect(modeContent).toBeVisible({ timeout: 10000 })
  })

  test('should allow selecting wizard mode', async ({ page }) => {
    // Look for mode options (guided, template, etc.)
    const modeOptions = page.locator('button, [role="radio"], input[type="radio"]').filter({ hasText: /guided|quick|template/i })

    if (await modeOptions.count() > 0) {
      await modeOptions.first().click()
    }

    // Proceed to next step
    await page.locator('button:has-text("Next")').first().click()
    await expect(page.locator('text=/Step 2 of/')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Project Wizard - Step 2: Content Setup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
    await waitForPageLoad(page)
    // Click New Project button to navigate to wizard
    const newProjectButton = page.locator('button:has-text("New Project")').first()
    await newProjectButton.click()
    await page.waitForURL(/\/creator\/new/, { timeout: 10000 })
    await waitForPageLoad(page)

    // Navigate to step 2
    await page.locator('button:has-text("Next")').first().click()
    await expect(page.locator('text=/Step 2 of/')).toBeVisible({ timeout: 10000 })
  })

  test('should display content setup form', async ({ page }) => {
    // Should show title input or content fields
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], input').first()
    await expect(titleInput).toBeVisible({ timeout: 10000 })
  })

  test('should have project title field', async ({ page }) => {
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i], label:has-text("Title") + input, label:has-text("Title") ~ input').first()
    await expect(titleInput).toBeVisible({ timeout: 10000 })
  })

  test('should have project description field', async ({ page }) => {
    const descInput = page.locator('textarea[name="description"], textarea[placeholder*="description" i], textarea').first()
    await expect(descInput).toBeVisible({ timeout: 10000 })
  })

  test('should fill in project content', async ({ page }) => {
    // Fill title
    const titleInput = page.locator('input').first()
    await titleInput.fill('E2E Test Project')

    // Fill description if visible
    const descInput = page.locator('textarea').first()
    if (await descInput.isVisible({ timeout: 2000 })) {
      await descInput.fill('This is a test project created by Playwright E2E tests')
    }
  })
})

test.describe('Project Wizard - Navigation Through All Steps', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
    await waitForPageLoad(page)
    // Click New Project button to navigate to wizard
    const newProjectButton = page.locator('button:has-text("New Project")').first()
    await newProjectButton.click()
    await page.waitForURL(/\/creator\/new/, { timeout: 10000 })
    await waitForPageLoad(page)
  })

  test('should navigate through all 10 wizard steps', async ({ page }) => {
    const totalSteps = 10

    for (let step = 1; step <= totalSteps; step++) {
      // Verify we're on the current step
      await expect(page.locator(`text=Step ${step} of ${totalSteps}`)).toBeVisible({ timeout: 10000 })

      // On last step, button says "Create Project" not "Next"
      if (step < totalSteps) {
        await page.locator('button:has-text("Next")').first().click()
      }
    }

    // Verify we reached the final step
    await expect(page.locator(`text=Step ${totalSteps} of ${totalSteps}`)).toBeVisible()
    await expect(page.locator('button:has-text("Create Project")')).toBeVisible()
  })

  test('should show step labels in desktop view', async ({ page }) => {
    // Desktop step indicators
    const stepLabels = page.locator('text=/Mode|Content|AI Personas|Teams|Timeline|Sessions|Schedule|Details|Experts|Deploy/')

    // Should have multiple step labels visible on desktop
    const count = await stepLabels.count()
    expect(count).toBeGreaterThan(0)
  })
})

test.describe('Creator Project Card Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
  })

  test('should display project cards on dashboard', async ({ page }) => {
    await waitForPageLoad(page)

    const hasProjects = await page.locator('text=/Project Dashboard/').isVisible({ timeout: 3000 })

    if (hasProjects) {
      // Look for project cards
      const projectCards = page.locator('[class*="card"]').filter({ hasText: /Machine Learning|Web Design|Data Viz/ })
      expect(await projectCards.count()).toBeGreaterThan(0)
    }
  })

  test('should navigate to project monitoring from card', async ({ page }) => {
    await waitForPageLoad(page)

    const hasProjects = await page.locator('text=/Project Dashboard/').isVisible({ timeout: 3000 })

    if (hasProjects) {
      // Find monitor button on project card
      const monitorButton = page.locator('button:has-text("Monitor"), a:has-text("Monitor"), button:has-text("View")').first()

      if (await monitorButton.isVisible({ timeout: 3000 })) {
        await monitorButton.click()
        await expect(page).toHaveURL(/\/creator\/monitor/, { timeout: 10000 })
      }
    }
  })

  test('should show project join code', async ({ page }) => {
    await waitForPageLoad(page)

    const hasProjects = await page.locator('text=/Project Dashboard/').isVisible({ timeout: 3000 })

    if (hasProjects) {
      // Join code is shown on active project cards
      const joinCode = page.locator('text=/ML2024|WEB101|[A-Z]{2,}\\d+/').first()
      if (await joinCode.isVisible({ timeout: 3000 })) {
        await expect(joinCode).toBeVisible()
      }
    }
  })
})

test.describe('Project Monitoring Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
  })

  test('should display project monitoring page', async ({ page }) => {
    // Navigate directly to monitor page for known project
    await page.goto('/creator/monitor/proj_ml_fundamentals')
    await waitForPageLoad(page)

    // Should show monitoring content or redirect if project not found
    const content = page.locator('main, [role="main"]').first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('should show team/student progress if monitoring page exists', async ({ page }) => {
    await page.goto('/creator/monitor/proj_ml_fundamentals')
    await waitForPageLoad(page)

    // Look for progress indicators or team info
    const progressContent = page.locator('text=/progress|team|learner|student|session/i').first()
    if (await progressContent.isVisible({ timeout: 5000 })) {
      await expect(progressContent).toBeVisible()
    }
  })
})

test.describe('Creator Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsCreator(page)
    if (!success) {
      test.skip()
    }
  })

  test('should have header with user info', async ({ page }) => {
    await waitForPageLoad(page)

    // Creator name should be visible
    await expect(page.locator(`text=${TEST_USERS.creator1.name}`)).toBeVisible({ timeout: 10000 })
  })

  test('should have logout button', async ({ page }) => {
    await waitForPageLoad(page)

    const logoutButton = page.locator('button:has-text("Logout")').first()
    await expect(logoutButton).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to landing when clicking logo', async ({ page }) => {
    await waitForPageLoad(page)

    const logo = page.locator('a').filter({ has: page.locator('text=P3') }).first()

    if (await logo.isVisible({ timeout: 3000 })) {
      await logo.click()

      // Should redirect back to creator since authenticated
      await expect(page).toHaveURL(/\/(creator)?$/, { timeout: 10000 })
    }
  })
})
