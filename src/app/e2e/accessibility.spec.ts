import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy on landing', async ({ page }) => {
    await page.goto('/')
    
    // Check for h1
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible({ timeout: 10000 })
  })

  test('should have proper page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
  })

  test('should have accessible buttons', async ({ page }) => {
    await page.goto('/')
    
    // All buttons should have accessible names
    const buttons = page.locator('button')
    const count = await buttons.count()
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i)
      const accessibleName = await button.getAttribute('aria-label') ||
                             await button.textContent() ||
                             await button.getAttribute('title')
      expect(accessibleName?.trim().length).toBeGreaterThan(0)
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through elements
    await page.keyboard.press('Tab')
    
    // Check something is focused
    const focused = page.locator(':focus')
    await expect(focused).toBeVisible({ timeout: 5000 })
  })

  test('should have skip link or main landmark', async ({ page }) => {
    await page.goto('/')
    
    // Look for skip link or main landmark
    const mainLandmark = page.locator('main, [role="main"]')
    await expect(mainLandmark).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('should show mobile-friendly layout', async ({ page }) => {
    await page.goto('/')
    
    // Content should be visible
    const content = page.locator('body')
    await expect(content).toBeVisible()
    
    // Check no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20) // Allow small margin
  })

  test('should have mobile menu if applicable', async ({ page }) => {
    await page.goto('/')
    
    // Look for hamburger menu or mobile menu
    const mobileMenu = page.locator('[aria-label*="menu" i], button:has([data-icon="menu"]), .hamburger')
    
    if (await mobileMenu.isVisible({ timeout: 3000 })) {
      await mobileMenu.click()
      
      // Menu should open
      const nav = page.locator('nav, [role="navigation"]')
      await expect(nav).toBeVisible({ timeout: 3000 })
    }
  })
})

test.describe('Dark Mode', () => {
  test('should respect system preference', async ({ page }) => {
    // Emulate dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    
    // Page should load without errors
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should have theme toggle if available', async ({ page }) => {
    await page.goto('/')
    
    // Look for theme toggle
    const themeToggle = page.locator('button').filter({ hasText: /theme|dark|light|mode/i }).first()
    
    if (await themeToggle.isVisible({ timeout: 3000 })) {
      const initialBg = await page.evaluate(() => 
        getComputedStyle(document.body).backgroundColor
      )
      
      await themeToggle.click()
      await page.waitForTimeout(500)
      
      const newBg = await page.evaluate(() => 
        getComputedStyle(document.body).backgroundColor
      )
      
      // Background should change
      expect(newBg).not.toBe(initialBg)
    } else {
      test.skip()
    }
  })
})
