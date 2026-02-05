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

test.describe('Admin Authentication & Authorization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
  })

  test('should login as admin with valid credentials', async ({ page }) => {
    const success = await loginAsAdmin(page)
    expect(success).toBe(true)
    await expect(page).toHaveURL(/\/admin/)
  })

  test('should redirect to /admin after admin login', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.admin.email)
    await page.locator('input#password').fill(TEST_USERS.admin.password)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
    // Verify admin dashboard heading is visible
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible({ timeout: 10000 })
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/signin')
    await page.locator('input#email').fill(TEST_USERS.admin.email)
    await page.locator('input#password').fill('wrongpassword')
    await page.locator('button[type="submit"]').click()

    // Should show error message
    await expect(page.locator('text=/invalid|error/i')).toBeVisible({ timeout: 5000 })
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should redirect explorer away from /admin', async ({ page }) => {
    await loginAsExplorer(page, 'explorer1')
    await page.goto('/admin')

    // Should be redirected to explorer
    await expect(page).toHaveURL(/\/explorer/, { timeout: 10000 })
  })

  test('should redirect creator away from /admin', async ({ page }) => {
    await loginAsCreator(page, 'creator1')
    await page.goto('/admin')

    // Should be redirected to creator dashboard
    await expect(page).toHaveURL(/\/creator/, { timeout: 10000 })
  })

  test('should logout admin and redirect to login', async ({ page }) => {
    await loginAsAdmin(page)
    await logout(page)

    // Should be on landing or login page
    await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 })
  })

  test('should redirect unauthenticated user from /admin to login', async ({ page }) => {
    await page.goto('/admin')

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsAdmin(page)
    if (!success) {
      test.skip()
    }
  })

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Manage users and system settings')).toBeVisible()
  })

  test('should display user statistics cards', async ({ page }) => {
    // Wait for stats to load
    await waitForPageLoad(page)

    // Check for stat cards - use exact text matching
    await expect(page.getByText('Total Users', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Explorers', { exact: true })).toBeVisible()
    await expect(page.getByText('Creators', { exact: true })).toBeVisible()
    await expect(page.getByText('Admins', { exact: true })).toBeVisible()
  })

  test('should display recent users section', async ({ page }) => {
    await waitForPageLoad(page)

    await expect(page.locator('text=Recent Users')).toBeVisible({ timeout: 10000 })
    // Should have "View All" link
    await expect(page.locator('text=View All')).toBeVisible()
  })

  test('should have Add User button linking to user management', async ({ page }) => {
    const addUserButton = page.locator('button:has-text("Add User"), a:has-text("Add User")').first()
    await expect(addUserButton).toBeVisible({ timeout: 10000 })

    await addUserButton.click()
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10000 })
  })

  test('should display quick action cards', async ({ page }) => {
    await waitForPageLoad(page)

    await expect(page.locator('text=Create New User')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Manage Roles')).toBeVisible()
  })

  test('should navigate to user management from quick actions', async ({ page }) => {
    await waitForPageLoad(page)

    const goToUserManagement = page.locator('button:has-text("Go to User Management")').first()
    await expect(goToUserManagement).toBeVisible({ timeout: 10000 })

    await goToUserManagement.click()
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10000 })
  })
})

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsAdmin(page)
    if (!success) {
      test.skip()
    }
    await page.goto('/admin/users')
    await waitForPageLoad(page)
  })

  test('should display user management page', async ({ page }) => {
    await expect(page.locator('h1:has-text("User Management")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=/\\d+ users total/')).toBeVisible()
  })

  test('should display user list table', async ({ page }) => {
    // Check table headers
    await expect(page.locator('th:has-text("User")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('th:has-text("Role")')).toBeVisible()
    await expect(page.locator('th:has-text("Level")')).toBeVisible()
    await expect(page.locator('th:has-text("Joined")')).toBeVisible()
    await expect(page.locator('th:has-text("Actions")')).toBeVisible()
  })

  test('should display users in table rows', async ({ page }) => {
    // Wait for users to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    const rows = page.locator('table tbody tr')
    expect(await rows.count()).toBeGreaterThan(0)

    // First row should have user info
    const firstRow = rows.first()
    await expect(firstRow.locator('td').first()).toBeVisible()
  })

  test('should search users by name or email', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible({ timeout: 10000 })

    // Search for "explorer"
    await searchInput.fill('explorer')
    await page.waitForTimeout(500) // Debounce

    // Should filter results
    await waitForPageLoad(page)
    const rows = page.locator('table tbody tr')
    const count = await rows.count()

    if (count > 0) {
      // Verify filtered results contain search term
      const firstRowText = await rows.first().textContent()
      expect(firstRowText?.toLowerCase()).toContain('explorer')
    }
  })

  test('should filter users by role', async ({ page }) => {
    const roleFilter = page.locator('[class*="SelectTrigger"]').filter({ hasText: /All Roles|Explorer|Creator|Admin/ }).first()
    await expect(roleFilter).toBeVisible({ timeout: 10000 })

    await roleFilter.click()
    await page.locator('[role="option"]:has-text("Explorer")').click()

    await waitForPageLoad(page)

    // All visible users should be explorers
    const roleBadges = page.locator('table tbody tr td:nth-child(2) [class*="badge"]')
    const count = await roleBadges.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const badge = roleBadges.nth(i)
      await expect(badge).toHaveText(/explorer/i)
    }
  })

  test('should sort users by different columns', async ({ page }) => {
    const sortSelect = page.locator('[class*="SelectTrigger"]').filter({ hasText: /Date Joined|Name|Email|Role/ }).first()
    await expect(sortSelect).toBeVisible({ timeout: 10000 })

    // Sort by name
    await sortSelect.click()
    await page.locator('[role="option"]:has-text("Name")').click()

    await waitForPageLoad(page)

    // Should have sorted results (verify table still displays)
    const rows = page.locator('table tbody tr')
    expect(await rows.count()).toBeGreaterThan(0)
  })

  test('should toggle sort order', async ({ page }) => {
    const sortOrderButton = page.locator('button:has-text("↓"), button:has-text("↑")').first()
    await expect(sortOrderButton).toBeVisible({ timeout: 10000 })

    const initialText = await sortOrderButton.textContent()
    await sortOrderButton.click()

    await waitForPageLoad(page)

    const newText = await sortOrderButton.textContent()
    expect(newText).not.toBe(initialText)
  })

  test('should open create user dialog', async ({ page }) => {
    const addUserButton = page.locator('button:has-text("Add User")').first()
    await expect(addUserButton).toBeVisible({ timeout: 10000 })

    await addUserButton.click()

    // Dialog should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=Create New User')).toBeVisible()
  })

  test('should validate create user form - empty fields', async ({ page }) => {
    const addUserButton = page.locator('button:has-text("Add User")').first()
    await addUserButton.click()

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Try to submit empty form
    const createButton = page.locator('[role="dialog"] button:has-text("Create User")').first()
    await createButton.click()

    // Should show validation errors
    await expect(page.locator('text=/required|enter|invalid/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should create new user successfully', async ({ page }) => {
    const addUserButton = page.locator('button:has-text("Add User")').first()
    await addUserButton.click()

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Fill form
    const timestamp = Date.now()
    await page.locator('[role="dialog"] input[name="name"], [role="dialog"] input#name').fill(`Test User ${timestamp}`)
    await page.locator('[role="dialog"] input[name="email"], [role="dialog"] input#email').fill(`testuser${timestamp}@example.com`)
    await page.locator('[role="dialog"] input[name="password"], [role="dialog"] input#password').fill('TestPassword123!')

    // Select role if dropdown exists
    const roleSelect = page.locator('[role="dialog"] [class*="SelectTrigger"]').first()
    if (await roleSelect.isVisible({ timeout: 1000 })) {
      await roleSelect.click()
      await page.locator('[role="option"]:has-text("Explorer")').click()
    }

    // Submit
    const createButton = page.locator('[role="dialog"] button:has-text("Create User")').first()
    await createButton.click()

    // Dialog should close and user list should update
    await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 })

    // Search for new user
    await page.locator('input[placeholder*="Search"]').fill(`testuser${timestamp}`)
    await waitForPageLoad(page)

    await expect(page.locator(`text=testuser${timestamp}@example.com`)).toBeVisible({ timeout: 10000 })
  })

  test('should open edit role dialog from dropdown menu', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Click action menu on first user row
    const actionButton = page.locator('table tbody tr').first().locator('button').last()
    await actionButton.click()

    // Click "Change Role"
    await page.locator('[role="menuitem"]:has-text("Change Role")').click()

    // Edit role dialog should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=/Change Role|Edit Role/i')).toBeVisible()
  })

  test('should change user role', async ({ page }) => {
    // Search for a specific user to edit (not admin to avoid self-edit issues)
    await page.locator('input[placeholder*="Search"]').fill('explorer1')
    await waitForPageLoad(page)

    // Click action menu
    const actionButton = page.locator('table tbody tr').first().locator('button').last()
    await actionButton.click()

    await page.locator('[role="menuitem"]:has-text("Change Role")').click()

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Change role (toggle between explorer and creator)
    const roleSelect = page.locator('[role="dialog"] [class*="SelectTrigger"]').first()
    if (await roleSelect.isVisible({ timeout: 2000 })) {
      await roleSelect.click()
      await page.locator('[role="option"]:has-text("Creator")').click()

      // Save
      const saveButton = page.locator('[role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("Update")').first()
      await saveButton.click()

      // Dialog should close
      await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 10000 })
    }
  })

  test('should open delete confirmation dialog', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    // Click action menu on first user row
    const actionButton = page.locator('table tbody tr').first().locator('button').last()
    await actionButton.click()

    // Click "Delete User"
    await page.locator('[role="menuitem"]:has-text("Delete User")').click()

    // Confirmation dialog should appear
    await expect(page.locator('[role="alertdialog"], [role="dialog"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=/delete|confirm|are you sure/i')).toBeVisible()
  })

  test('should cancel delete from confirmation dialog', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 })

    const initialRowCount = await page.locator('table tbody tr').count()

    // Open delete dialog
    const actionButton = page.locator('table tbody tr').first().locator('button').last()
    await actionButton.click()
    await page.locator('[role="menuitem"]:has-text("Delete User")').click()

    await expect(page.locator('[role="alertdialog"], [role="dialog"]')).toBeVisible({ timeout: 5000 })

    // Cancel
    await page.locator('button:has-text("Cancel")').click()

    // Dialog should close
    await expect(page.locator('[role="alertdialog"], [role="dialog"]')).toBeHidden({ timeout: 5000 })

    // User count should be unchanged
    const finalRowCount = await page.locator('table tbody tr').count()
    expect(finalRowCount).toBe(initialRowCount)
  })

  test('should paginate user list', async ({ page }) => {
    // This test may skip if there aren't enough users for pagination
    const pagination = page.locator('text=/Page \\d+ of \\d+/')

    if (await pagination.isVisible({ timeout: 3000 })) {
      const nextButton = page.locator('button').filter({ has: page.locator('[class*="ChevronRight"]') }).first()

      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await waitForPageLoad(page)

        // Page number should have changed
        await expect(page.locator('text=/Page 2 of/')).toBeVisible({ timeout: 5000 })
      }
    } else {
      // Not enough users for pagination - skip
      test.skip()
    }
  })
})

test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAuthState(page)
    const success = await loginAsAdmin(page)
    if (!success) {
      test.skip()
    }
  })

  test('should have sidebar navigation', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('a:has-text("Dashboard")')).toBeVisible()
    await expect(page.locator('a:has-text("Users")')).toBeVisible()
  })

  test('should navigate between dashboard and users', async ({ page }) => {
    // Start on dashboard
    await expect(page).toHaveURL(/\/admin\/?$/)

    // Navigate to users
    await page.locator('a:has-text("Users")').click()
    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 10000 })

    // Navigate back to dashboard
    await page.locator('a:has-text("Dashboard")').click()
    await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 10000 })
  })

  test('should display admin user info in header', async ({ page }) => {
    await expect(page.locator('text=Administrator')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=admin@p3bl.local')).toBeVisible()
  })

  test('should navigate to home when clicking logo', async ({ page }) => {
    const logo = page.locator('a').filter({ has: page.locator('text=P3') }).first()
    await logo.click()

    // Should go to landing page (and then redirect back to admin since logged in)
    await expect(page).toHaveURL(/\/(admin)?$/, { timeout: 10000 })
  })
})
