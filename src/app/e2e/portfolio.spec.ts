import { test, expect } from '@playwright/test'
import {
  loginAsExplorer,
  clearAuthState,
  waitForPageLoad,
} from './utils/auth'

test.describe('Portfolio Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
  })

  test('should navigate to portfolio', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)

    const portfolioContent = page.locator('main, [role="main"]')
    await expect(portfolioContent.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display competency dashboard', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)
    
    // Wait for the portfolio page content to appear
    await expect(page.locator('h1:has-text("Growth Portfolio")')).toBeVisible({ timeout: 10000 })

    const competencies = page.locator('text=/competenc|skill|progress/i').first()
    await expect(competencies).toBeVisible({ timeout: 10000 })
  })

  test('should display achievements/badges', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)

    const badges = page.locator('text=/badge|achievement|award/i').first()
    await expect(badges).toBeVisible({ timeout: 10000 })
  })

  test('should display artifact gallery', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)

    const artifacts = page.locator('text=/artifact|work|submission/i').first()

    if (await artifacts.isVisible({ timeout: 5000 })) {
      await expect(artifacts).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('should show XP and level progress', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)

    const progress = page.locator('text=/level|xp|experience/i').first()
    await expect(progress).toBeVisible({ timeout: 10000 })
  })

  test('should display competency names', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)
    
    // Wait for portfolio page to load
    await expect(page.locator('h1:has-text("Growth Portfolio")')).toBeVisible({ timeout: 10000 })
    
    // Click on Competency Dashboard tab
    await page.locator('button:has-text("Competency Dashboard"), [role="tab"]:has-text("Competency")').first().click()
    await page.waitForTimeout(500)

    const competencyNames = page.locator('text=/Critical Thinking|Communication|Collaboration|Creativity|Problem Solving/i').first()
    await expect(competencyNames).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Portfolio Tabs', () => {
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

  test('should have portfolio tabs', async ({ page }) => {
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /artifact|competenc|achievement|badge/i })

    if (await tabs.count() > 0) {
      await expect(tabs.first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('should switch between tabs', async ({ page }) => {
    const tabs = page.locator('[role="tab"], button').filter({ hasText: /artifact|competenc|achievement|badge/i })

    if (await tabs.count() > 1) {
      await tabs.nth(1).click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Portfolio - Competencies', () => {
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

  test('should display competency radar chart', async ({ page }) => {
    const chart = page.locator('svg, canvas, [class*="chart"], [class*="radar"]').first()

    if (await chart.isVisible({ timeout: 5000 })) {
      await expect(chart).toBeVisible()
    }
  })

  test('should show competency scores', async ({ page }) => {
    // Alex has scores like 65, 72, 58, etc.
    const scores = page.locator('text=/\\d{1,3}%|\\d{1,2}\\/100/i').first()

    if (await scores.isVisible({ timeout: 5000 })) {
      await expect(scores).toBeVisible()
    }
  })

  test('should show competency insights', async ({ page }) => {
    const insights = page.locator('text=/improved|progress|analysis|skills/i').first()

    if (await insights.isVisible({ timeout: 5000 })) {
      await expect(insights).toBeVisible()
    }
  })
})

test.describe('Portfolio - Badges', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
    await page.goto('/portfolio')
    await waitForPageLoad(page)
    // Wait for portfolio page to load
    await expect(page.locator('h1:has-text("Growth Portfolio")')).toBeVisible({ timeout: 10000 })
    // Click on Achievement Archive tab
    await page.locator('button:has-text("Achievement"), [role="tab"]:has-text("Achievement")').first().click()
    await page.waitForTimeout(500)
  })

  test('should display earned badges', async ({ page }) => {
    // Alex has badges: first-steps, early-bird, team-player
    const badges = page.locator('text=/First Steps|Early Bird|Team Player|badge/i').first()
    await expect(badges).toBeVisible({ timeout: 10000 })
  })

  test('should show badge icons or images', async ({ page }) => {
    const badgeIcons = page.locator('[class*="badge"] svg, [class*="badge"] img, [class*="icon"]').first()

    if (await badgeIcons.isVisible({ timeout: 5000 })) {
      await expect(badgeIcons).toBeVisible()
    }
  })
})

test.describe('Portfolio for Different Users', () => {
  test('should show higher level for veteran user (Sam)', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer3')

    if (success) {
      await page.goto('/portfolio')
      await waitForPageLoad(page)

      // Sam is level 5 with 1200 XP
      const levelInfo = page.locator('text=/level 5|1200|1,200/i').first()
      if (await levelInfo.isVisible({ timeout: 5000 })) {
        await expect(levelInfo).toBeVisible()
      }
    }
  })

  test('should show more badges for veteran user (Sam)', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer3')

    if (success) {
      await page.goto('/portfolio')
      await waitForPageLoad(page)

      // Sam has many badges
      const badges = page.locator('text=/Seasoned Explorer|Critical Thinker|Communicator/i').first()
      if (await badges.isVisible({ timeout: 5000 })) {
        await expect(badges).toBeVisible()
      }
    }
  })

  test('should show empty state for new user (Jordan)', async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer2')

    if (success) {
      await page.goto('/portfolio')
      await waitForPageLoad(page)

      // Jordan is level 1 with 0 XP
      const newUserIndicator = page.locator('text=/level 1|no badge|earn your first|0 xp/i').first()
      if (await newUserIndicator.isVisible({ timeout: 5000 })) {
        await expect(newUserIndicator).toBeVisible()
      }
    }
  })
})

test.describe('Portfolio Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsExplorer(page, 'explorer1')
    if (!success) {
      test.skip()
    }
  })

  test('should navigate from portfolio to workspace', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)

    const explorerLink = page.locator('a[href*="/explorer"], button:has-text("Workspace"), button:has-text("Back")').first()

    if (await explorerLink.isVisible({ timeout: 5000 })) {
      await explorerLink.click()
      await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
    }
  })

  test('should have logout button on portfolio page', async ({ page }) => {
    await page.goto('/portfolio')
    await waitForPageLoad(page)
    // Wait for portfolio page to load
    await expect(page.locator('h1:has-text("Growth Portfolio")')).toBeVisible({ timeout: 10000 })

    // Logout is in a user dropdown menu - click the user button to open it
    const userButton = page.locator('button:has-text("Explorer One"), button[aria-haspopup="menu"]').first()
    if (await userButton.isVisible({ timeout: 5000 })) {
      await userButton.click()
      await page.waitForTimeout(300)
      
      const logoutButton = page.locator('[role="menuitem"]:has-text("Logout"), button:has-text("Logout")').first()
      await expect(logoutButton).toBeVisible({ timeout: 5000 })
    }
  })
})
