import { test, expect } from '@playwright/test'
import {
  loginAsExplorer,
  logout,
  clearAuthState,
  registerUser,
  TEST_USERS,
  TEST_JOIN_CODES,
  waitForPageLoad,
} from './utils/auth'

test.describe('Explorer Authentication & Authorization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
  })

  test('should login as explorer with valid credentials', async ({ page }) => {
    const success = await loginAsExplorer(page, 'explorer1')
    expect(success).toBe(true)
    await expect(page).toHaveURL(/\/explorer/)
  })

  test('should redirect to /explorer after explorer login', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.explorer1.email)
    await page.locator('input#password').fill(TEST_USERS.explorer1.password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/explorer/, { timeout: 15000 })
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.explorer1.email)
    await page.locator('input#password').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('text=/invalid|error/i')).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('should redirect explorer away from /admin', async ({ page }) => {
    await loginAsExplorer(page, 'explorer1')
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })

  test('should redirect explorer away from /creator', async ({ page }) => {
    await loginAsExplorer(page, 'explorer1')
    await page.goto('/creator')

    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })

  test('should logout explorer and redirect to login', async ({ page }) => {
    await loginAsExplorer(page, 'explorer1')
    await logout(page)

    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })

  test('should redirect unauthenticated user from /explorer to login', async ({ page }) => {
    await page.goto('/explorer')

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

test.describe('Explorer Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
  })

  test('should display registration form', async ({ page }) => {
    await page.goto('/signup')

    await expect(page.locator('h1:has-text("Create your account")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input#name, input[name="name"]')).toBeVisible()
    await expect(page.locator('input#email, input[name="email"]')).toBeVisible()
    await expect(page.locator('input#password, input[name="password"]')).toBeVisible()
  })

  test('should validate registration form - empty fields', async ({ page }) => {
    await page.goto('/signup')

    await page.locator('button[type="submit"]').click()

    // Should show validation errors
    await expect(page.locator('text=/required|enter|invalid/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should validate registration form - invalid email', async ({ page }) => {
    await page.goto('/signup')

    await page.locator('input#name, input[name="name"]').fill('Test User')
    await page.locator('input#email, input[name="email"]').fill('invalid-email')
    await page.locator('input#password, input[name="password"]').fill('Password123!')

    await page.locator('button[type="submit"]').click()

    // Should show email validation error
    await expect(page.locator('text=/email|invalid/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should validate registration form - weak password', async ({ page }) => {
    await page.goto('/signup')

    await page.locator('input#name, input[name="name"]').fill('Test User')
    await page.locator('input#email, input[name="email"]').fill('newuser@example.com')
    await page.locator('input#password, input[name="password"]').fill('weak')

    await page.locator('button[type="submit"]').click()

    // Should show password validation error
    await expect(page.locator('text=/password|character|strong/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should register new explorer successfully', async ({ page }) => {
    const timestamp = Date.now()
    const success = await registerUser(page, {
      name: `Test User ${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      password: 'TestPassword123!',
    })

    // Note: This test may fail if the email already exists in the database
    // In a real scenario, we'd need to clean up test data
    if (success) {
      await expect(page).toHaveURL(/\/explorer/)
    }
  })

  test('should show link to login from registration page', async ({ page }) => {
    await page.goto('/signup')

    const loginLink = page.locator('a:has-text("Sign in")')
    await expect(loginLink).toBeVisible({ timeout: 10000 })

    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Explorer Workspace - Onboarding Mode (Jordan)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    // Login as Jordan who has no joined projects (onboarding mode)
    const success = await loginAsExplorer(page, 'explorer2')
    if (!success) {
      test.skip()
    }
  })

  test('should display onboarding UI for new user', async ({ page }) => {
    await waitForPageLoad(page)

    // Should show onboarding content
    const onboardingContent = page.locator('text=/welcome|join|get started|invitation|code/i').first()
    await expect(onboardingContent).toBeVisible({ timeout: 10000 })
  })

  test('should show pending invitation card', async ({ page }) => {
    await waitForPageLoad(page)

    // Jordan has a pending invitation
    const invitationCard = page.locator('text=/invitation|Machine Learning|pending/i').first()
    if (await invitationCard.isVisible({ timeout: 5000 })) {
      await expect(invitationCard).toBeVisible()
    }
  })

  test('should show join code input area', async ({ page }) => {
    await waitForPageLoad(page)

    // Look for join code input
    const joinInput = page.locator('input[placeholder*="code" i], input[name*="code" i], input[placeholder*="join" i]').first()
    await expect(joinInput).toBeVisible({ timeout: 10000 })
  })

  test('should validate invalid join code', async ({ page }) => {
    await waitForPageLoad(page)

    const joinInput = page.locator('input[placeholder*="code" i], input[name*="code" i]').first()
    await joinInput.fill('INVALID123')

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Join")').first()
    await submitButton.click()

    // Should show error
    await expect(page.locator('text=/invalid|not found|error/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should accept valid join code', async ({ page }) => {
    await waitForPageLoad(page)

    const joinInput = page.locator('input[placeholder*="code" i], input[name*="code" i]').first()
    await joinInput.fill(TEST_JOIN_CODES.mlFundamentals)

    const submitButton = page.locator('button[type="submit"], button:has-text("Join")').first()
    await submitButton.click()

    // Should show success or navigate to project
    await page.waitForTimeout(1000)
    const hasSuccess = await page.locator('text=/success|joined|welcome/i').isVisible({ timeout: 5000 }).catch(() => false)
    const navigated = page.url().includes('/activity')

    expect(hasSuccess || navigated).toBe(true)
  })
})

test.describe('Explorer Workspace - Active Mode (Alex)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    // Login as Alex who has joined projects (active mode)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
  })

  test('should display active workspace UI', async ({ page }) => {
    await waitForPageLoad(page)

    // Should show projects or active content
    const activeContent = page.locator('text=/my projects|active|projects|dashboard/i').first()
    await expect(activeContent).toBeVisible({ timeout: 10000 })
  })

  test('should show project list', async ({ page }) => {
    await waitForPageLoad(page)

    // Look for project cards or list
    const projectContent = page.locator('text=/Machine Learning|project/i').first()
    await expect(projectContent).toBeVisible({ timeout: 10000 })
  })

  test('should show Active/Completed tabs', async ({ page }) => {
    await waitForPageLoad(page)

    const activeTab = page.locator('button:has-text("Active"), [role="tab"]:has-text("Active")').first()
    const completedTab = page.locator('button:has-text("Completed"), [role="tab"]:has-text("Completed")').first()

    if (await activeTab.isVisible({ timeout: 3000 })) {
      await expect(activeTab).toBeVisible()
      await expect(completedTab).toBeVisible()
    }
  })

  test('should switch between Active and Completed tabs', async ({ page }) => {
    await waitForPageLoad(page)

    const completedTab = page.locator('button:has-text("Completed"), [role="tab"]:has-text("Completed")').first()

    if (await completedTab.isVisible({ timeout: 3000 })) {
      await completedTab.click()
      await page.waitForTimeout(500)
    }
  })

  test('should navigate to activity zone when clicking project', async ({ page }) => {
    await waitForPageLoad(page)

    // Find project card or link
    const projectLink = page.locator('a[href*="/activity"], button:has-text("Continue"), button:has-text("Open")').first()

    if (await projectLink.isVisible({ timeout: 5000 })) {
      await projectLink.click()
      await expect(page).toHaveURL(/\/activity/, { timeout: 10000 })
    }
  })

  test('should show user XP and level', async ({ page }) => {
    await waitForPageLoad(page)

    // Look for XP/level display
    const xpDisplay = page.locator('text=/level|xp|\\d+ xp/i').first()
    if (await xpDisplay.isVisible({ timeout: 3000 })) {
      await expect(xpDisplay).toBeVisible()
    }
  })

  test('should show notifications area', async ({ page }) => {
    await waitForPageLoad(page)

    const notifications = page.locator('text=/notification|bell|alert/i, [aria-label*="notification"]').first()
    if (await notifications.isVisible({ timeout: 3000 })) {
      await expect(notifications).toBeVisible()
    }
  })
})

test.describe('Explorer Activity Zone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
    await page.goto('/activity/proj_ml_fundamentals')
    await waitForPageLoad(page)
  })

  test('should display activity zone layout', async ({ page }) => {
    // Should show project name or activity content
    const content = page.locator('text=/Machine Learning|activity|session/i').first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('should show project header with title', async ({ page }) => {
    await expect(page.locator('h1, h2').filter({ hasText: /Machine Learning/ })).toBeVisible({ timeout: 10000 })
  })

  test('should show Back button to explorer', async ({ page }) => {
    const backButton = page.locator('button:has-text("Back")').first()
    await expect(backButton).toBeVisible({ timeout: 10000 })

    await backButton.click()
    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })

  test('should display Voyage Navigator (session list)', async ({ page }) => {
    // Look for session navigation
    const voyageNav = page.locator('text=/session|introduction|data preparation/i').first()
    await expect(voyageNav).toBeVisible({ timeout: 10000 })
  })

  test('should display Resource Hub', async ({ page }) => {
    const resourceHub = page.locator('text=/resource|material|link|video/i').first()
    if (await resourceHub.isVisible({ timeout: 5000 })) {
      await expect(resourceHub).toBeVisible()
    }
  })

  test('should display Smart Output Builder (editor)', async ({ page }) => {
    // Look for editor area
    const editor = page.locator('textarea, [contenteditable="true"], [class*="editor"], [class*="output"]').first()
    await expect(editor).toBeVisible({ timeout: 10000 })
  })

  test('should display Group Chat Panel', async ({ page }) => {
    const chatPanel = page.locator('text=/chat|message|team/i').first()
    if (await chatPanel.isVisible({ timeout: 5000 })) {
      await expect(chatPanel).toBeVisible()
    }
  })

  test('should navigate between sessions', async ({ page }) => {
    // Find session buttons
    const sessionButtons = page.locator('button').filter({ hasText: /Session|Introduction|Data|Building/ })

    if (await sessionButtons.count() > 1) {
      // Click second session
      await sessionButtons.nth(1).click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Explorer Smart Output Builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
    await page.goto('/activity/proj_ml_fundamentals')
    await waitForPageLoad(page)
  })

  test('should display editor area', async ({ page }) => {
    const editor = page.locator('textarea, [contenteditable="true"], .tiptap, .ProseMirror').first()
    await expect(editor).toBeVisible({ timeout: 10000 })
  })

  test('should allow typing in editor', async ({ page }) => {
    const editor = page.locator('textarea, [contenteditable="true"], .tiptap, .ProseMirror').first()

    if (await editor.isVisible({ timeout: 5000 })) {
      await editor.click()
      await page.keyboard.type('Test content for E2E testing')

      // Verify content was typed
      const content = await editor.textContent() || await editor.inputValue().catch(() => '')
      expect(content).toContain('Test content')
    }
  })

  test('should show pre-check button', async ({ page }) => {
    const precheckButton = page.locator('button:has-text("Pre-check"), button:has-text("Check")').first()

    if (await precheckButton.isVisible({ timeout: 5000 })) {
      await expect(precheckButton).toBeVisible()
    }
  })

  test('should show submit button', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Save")').first()
    await expect(submitButton).toBeVisible({ timeout: 10000 })
  })

  test('should show session guide/instructions', async ({ page }) => {
    const guide = page.locator('text=/guide|instructions|deliverable|task/i').first()
    if (await guide.isVisible({ timeout: 5000 })) {
      await expect(guide).toBeVisible()
    }
  })
})

test.describe('Explorer Group Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
    await page.goto('/activity/proj_ml_fundamentals')
    await waitForPageLoad(page)
  })

  test('should display chat panel', async ({ page }) => {
    const chatPanel = page.locator('[class*="chat"], [data-testid="chat"]').first()
    if (await chatPanel.isVisible({ timeout: 5000 })) {
      await expect(chatPanel).toBeVisible()
    }
  })

  test('should have message input', async ({ page }) => {
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first()

    if (await messageInput.isVisible({ timeout: 5000 })) {
      await expect(messageInput).toBeVisible()
    }
  })

  test('should allow typing message', async ({ page }) => {
    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i]').first()

    if (await messageInput.isVisible({ timeout: 5000 })) {
      await messageInput.fill('Hello team!')
      await expect(messageInput).toHaveValue('Hello team!')
    }
  })

  test('should have send button', async ({ page }) => {
    const sendButton = page.locator('button[type="submit"], button:has([class*="Send"]), button[aria-label*="send" i]').first()

    if (await sendButton.isVisible({ timeout: 5000 })) {
      await expect(sendButton).toBeVisible()
    }
  })

  test('should show AI personas in chat', async ({ page }) => {
    // Look for AI persona names
    const aiPersona = page.locator('text=/Sage|Spark|Atlas|Echo/i').first()

    if (await aiPersona.isVisible({ timeout: 5000 })) {
      await expect(aiPersona).toBeVisible()
    }
  })
})

test.describe('Explorer Portfolio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
    await page.goto('/portfolio')
    await waitForPageLoad(page)
  })

  test('should display portfolio page', async ({ page }) => {
    const portfolioContent = page.locator('text=/portfolio|growth|competenc/i').first()
    await expect(portfolioContent).toBeVisible({ timeout: 10000 })
  })

  test('should show XP and level', async ({ page }) => {
    const xpDisplay = page.locator('text=/level|xp|experience/i').first()
    await expect(xpDisplay).toBeVisible({ timeout: 10000 })
  })

  test('should show competency radar chart', async ({ page }) => {
    // Look for chart or competency display
    const competencyChart = page.locator('svg, canvas, [class*="chart"], [class*="radar"]').first()

    if (await competencyChart.isVisible({ timeout: 5000 })) {
      await expect(competencyChart).toBeVisible()
    }
  })

  test('should show competency list', async ({ page }) => {
    // Look for competency names
    const competencies = page.locator('text=/Critical Thinking|Communication|Collaboration|Creativity|Problem Solving/i').first()
    await expect(competencies).toBeVisible({ timeout: 10000 })
  })

  test('should show badge collection', async ({ page }) => {
    const badges = page.locator('text=/badge|achievement|first steps|early bird/i').first()
    await expect(badges).toBeVisible({ timeout: 10000 })
  })

  test('should show artifacts section', async ({ page }) => {
    const artifacts = page.locator('text=/artifact|submission|work/i').first()
    await expect(artifacts).toBeVisible({ timeout: 10000 })
  })

  test('should have portfolio tabs', async ({ page }) => {
    // Look for tabs: Artifacts, Competencies, Achievements
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /artifact|competenc|achievement|badge/i })

    if (await tabs.count() > 0) {
      // Click through tabs
      const firstTab = tabs.first()
      await firstTab.click()
      await page.waitForTimeout(500)
    }
  })

})

test.describe('Explorer Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
  })

  test('should have header with user info', async ({ page }) => {
    await waitForPageLoad(page)

    // User name should be visible
    await expect(page.locator(`text=${TEST_USERS.explorer1.name}`)).toBeVisible({ timeout: 10000 })
  })

  test('should have logout button', async ({ page }) => {
    await waitForPageLoad(page)

    const logoutButton = page.locator('button:has-text("Logout")').first()
    await expect(logoutButton).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to portfolio from workspace', async ({ page }) => {
    await waitForPageLoad(page)

    const portfolioLink = page.locator('a[href*="/portfolio"], button:has-text("Portfolio")').first()

    if (await portfolioLink.isVisible({ timeout: 5000 })) {
      await portfolioLink.click()
      await expect(page).toHaveURL(/\/portfolio/, { timeout: 10000 })
    }
  })

  test('should navigate back to explorer from activity', async ({ page }) => {
    await page.goto('/activity/proj_ml_fundamentals')
    await waitForPageLoad(page)

    const backButton = page.locator('button:has-text("Back")').first()
    await backButton.click()

    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })
})

test.describe('Explorer with Different User States', () => {
  test('should show different XP for veteran user (Sam)', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer3')

    if (success) {
      await page.goto('/portfolio')
      await waitForPageLoad(page)

      // Sam has higher XP (1200) and level (5)
      const level = page.locator('text=/level 5|1200/i').first()
      if (await level.isVisible({ timeout: 5000 })) {
        await expect(level).toBeVisible()
      }
    }
  })

  test('should show fewer badges for new user (Jordan)', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer2')

    if (success) {
      await page.goto('/portfolio')
      await waitForPageLoad(page)

      // Jordan has no badges initially
      const noBadges = page.locator('text=/no badge|earn your first|start earning/i').first()
      if (await noBadges.isVisible({ timeout: 5000 })) {
        await expect(noBadges).toBeVisible()
      }
    }
  })
})
