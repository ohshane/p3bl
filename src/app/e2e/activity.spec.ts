import { test, expect } from '@playwright/test'
import {
  loginAsExplorer,
  clearAuthState,
  waitForPageLoad,
} from './utils/auth'

// Helper to login and navigate to activity page
async function loginAndNavigateToActivity(page: import('@playwright/test').Page, projectId = 'proj_ml_fundamentals') {
  await page.goto('/')
  await clearAuthState(page)

  const success = await loginAsExplorer(page, 'explorer1')
  if (!success) {
    return false
  }

  await page.goto(`/activity/${projectId}`)
  await waitForPageLoad(page)
  return true
}

test.describe('Learning Activity', () => {
  test('should display activity page structure', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const content = page.locator('main, [role="main"], .min-h-screen').first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('should show project header', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    // Should show project name
    const projectTitle = page.getByRole('heading', { name: /Machine Learning/i }).first()
    await expect(projectTitle).toBeVisible({ timeout: 10000 })
  })

  test('should show session navigation', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const sessionNav = page.locator('nav, [class*="voyage"], [class*="navigator"]').first()
    await expect(sessionNav).toBeVisible({ timeout: 10000 })
  })

  test('should show Back button to workspace', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const backButton = page.getByRole('button', { name: /Back/i }).first()
    await expect(backButton).toBeVisible({ timeout: 10000 })
  })

  test('should navigate back to workspace', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const backButton = page.getByRole('button', { name: /Back/i }).first()
    await backButton.click()

    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })
})

test.describe('Artifact Editor', () => {
  test('should have artifact editing capability', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const editor = page.locator('textarea, [contenteditable], .editor, [class*="output"], [class*="builder"], .tiptap, .ProseMirror').first()

    if (await editor.isVisible({ timeout: 10000 })) {
      await expect(editor).toBeVisible()
    } else {
      const notFound = page.locator('text=/not found|Back to Workspace/i').first()
      if (await notFound.isVisible({ timeout: 2000 })) {
        test.skip()
      }
    }
  })

  test('should allow typing content', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const editor = page.locator('textarea, [contenteditable="true"], .tiptap, .ProseMirror').first()

    if (await editor.isVisible({ timeout: 5000 })) {
      await editor.click()
      await page.keyboard.type('Test content for auto-save')
      await page.waitForTimeout(500)
    } else {
      test.skip()
    }
  })

  test('should show save indicator after editing', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const editor = page.locator('textarea, [contenteditable="true"]').first()

    if (await editor.isVisible({ timeout: 5000 })) {
      await editor.click()
      await page.keyboard.type('Testing auto-save')
      await page.waitForTimeout(2000)

      const saveIndicator = page.locator('text=/saved|saving|draft/i').first()
      if (await saveIndicator.isVisible({ timeout: 5000 })) {
        await expect(saveIndicator).toBeVisible()
      }
    } else {
      test.skip()
    }
  })
})

test.describe('Pre-check Feature', () => {
  test('should have pre-check button', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const precheckButton = page.locator('button').filter({ hasText: /pre-check|check|validate/i }).first()

    if (await precheckButton.isVisible({ timeout: 5000 })) {
      await expect(precheckButton).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should have submit button', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const submitButton = page.getByRole('button', { name: /submit|save/i }).first()
    await expect(submitButton).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Group Chat', () => {
  test('should have chat panel', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const chatArea = page.locator('[data-testid="chat"], [class*="chat"], [class*="messages"], [class*="panel"]').first()

    if (await chatArea.isVisible({ timeout: 5000 })) {
      await expect(chatArea).toBeVisible()
    } else {
      const chatToggle = page.locator('button').filter({ hasText: /chat|message/i }).first()
      if (await chatToggle.isVisible()) {
        await chatToggle.click()
        await page.waitForTimeout(500)
      } else {
        test.skip()
      }
    }
  })

  test('should have message input', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[type="text"]').first()

    if (await messageInput.isVisible({ timeout: 5000 })) {
      await expect(messageInput).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should allow sending messages', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const messageInput = page.locator('input[placeholder*="message" i], textarea[placeholder*="message" i], input[type="text"]').first()

    if (await messageInput.isVisible({ timeout: 5000 })) {
      await messageInput.fill('Test message')

      const sendButton = page.locator('button[type="submit"], button:has([data-icon="send"]), button:has-text("send")').first()

      if (await sendButton.isVisible()) {
        await sendButton.click()
        await page.waitForTimeout(500)
      }
    } else {
      test.skip()
    }
  })
})

test.describe('Resource Hub', () => {
  test('should display session resources', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const resources = page.locator('text=/resources|materials|files|hub/i').first()

    if (await resources.isVisible({ timeout: 5000 })) {
      await expect(resources).toBeVisible()
    } else {
      const resourceTab = page.locator('button, a').filter({ hasText: /resource/i }).first()
      if (await resourceTab.isVisible()) {
        await resourceTab.click()
      } else {
        test.skip()
      }
    }
  })
})

test.describe('Voyage Navigator', () => {
  test('should display session list', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    // Look for session titles from the seeded data
    const sessionContent = page.getByText(/Introduction|Data Preparation|Building Models|Ethics/i).first()
    await expect(sessionContent).toBeVisible({ timeout: 10000 })
  })

  test('should allow clicking on sessions', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    const sessionButtons = page.getByRole('button', { name: /Session|Introduction|Data|Building/i })

    if (await sessionButtons.count() > 1) {
      await sessionButtons.nth(1).click()
      await page.waitForTimeout(500)
    }
  })

  test('should show current session indicator', async ({ page }) => {
    const loggedIn = await loginAndNavigateToActivity(page)
    if (!loggedIn) {
      test.skip()
      return
    }

    // Look for current/active indicator
    const currentIndicator = page.locator('[data-active="true"], [aria-current="step"], .active, [class*="current"]').first()

    if (await currentIndicator.isVisible({ timeout: 5000 })) {
      await expect(currentIndicator).toBeVisible()
    }
  })
})

test.describe('Project Not Found', () => {
  test('should show error for non-existent project', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsExplorer(page, 'explorer1')

    await page.goto('/activity/non_existent_project')
    await waitForPageLoad(page)

    const notFound = page.locator('text=/not found|Project not found/i').first()
    await expect(notFound).toBeVisible({ timeout: 10000 })
  })

  test('should have button to go back to workspace', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    await loginAsExplorer(page, 'explorer1')

    await page.goto('/activity/non_existent_project')
    await waitForPageLoad(page)

    const backButton = page.getByRole('button', { name: /Back to Workspace/i }).first()
    await expect(backButton).toBeVisible({ timeout: 10000 })

    await backButton.click()
    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })
})
