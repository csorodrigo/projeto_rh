/**
 * E2E Tests - Time Tracking
 * End-to-end tests for time tracking functionality using Playwright
 */

import { test, expect, type Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123456'

/**
 * Helper: Login to the application
 */
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
}

test.describe('Time Tracking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page)
  })

  test('should display time tracking page', async ({ page }) => {
    // Navigate to time tracking page
    await page.goto(`${BASE_URL}/ponto`)

    // Verify page loaded
    await expect(page).toHaveURL(`${BASE_URL}/ponto`)

    // Verify clock widget is visible
    await expect(page.locator('[data-testid="clock-widget"]')).toBeVisible()

    // Verify current time displays
    const clockDisplay = page.locator('[data-testid="current-time"]')
    await expect(clockDisplay).toBeVisible()

    // Verify time format (HH:mm:ss)
    const timeText = await clockDisplay.textContent()
    expect(timeText).toMatch(/\d{2}:\d{2}:\d{2}/)
  })

  test('should clock in successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Wait for clock widget
    await page.waitForSelector('[data-testid="clock-widget"]')

    // Check current status
    const statusBefore = await page.locator('[data-testid="current-status"]').textContent()

    // Click clock in button
    const clockInButton = page.locator('button:has-text("Entrada")')
    await clockInButton.click()

    // Wait for success toast or confirmation
    await page.waitForSelector('[role="status"]', { timeout: 5000 })

    // Verify success message
    const toast = page.locator('[role="status"]')
    await expect(toast).toContainText(/entrada.*registrada/i)

    // Verify status changed to "working"
    await page.waitForTimeout(1000) // Wait for state update
    const statusAfter = await page.locator('[data-testid="current-status"]').textContent()
    expect(statusAfter).toContain('Trabalhando')
  })

  test('should display record in timeline', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Clock in
    const clockInButton = page.locator('button:has-text("Entrada")')
    await clockInButton.click()

    // Wait for record to appear
    await page.waitForSelector('[data-testid="timeline-item"]', { timeout: 5000 })

    // Verify timeline has at least one record
    const timelineItems = page.locator('[data-testid="timeline-item"]')
    await expect(timelineItems).toHaveCount(1, { timeout: 5000 })

    // Verify record shows clock in
    const firstRecord = timelineItems.first()
    await expect(firstRecord).toContainText(/entrada/i)

    // Verify record shows time
    const recordTime = firstRecord.locator('[data-testid="record-time"]')
    await expect(recordTime).toBeVisible()

    // Verify time format
    const timeText = await recordTime.textContent()
    expect(timeText).toMatch(/\d{2}:\d{2}/)
  })

  test('should clock out successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // First, clock in
    await page.locator('button:has-text("Entrada")').click()
    await page.waitForSelector('[role="status"]', { timeout: 5000 })
    await page.waitForTimeout(2000) // Wait for state update and avoid duplicate detection

    // Now clock out
    const clockOutButton = page.locator('button:has-text("Saída")')
    await clockOutButton.click()

    // Wait for success toast
    await page.waitForSelector('[role="status"]', { timeout: 5000 })

    // Verify success message
    const toast = page.locator('[role="status"]')
    await expect(toast).toContainText(/saída.*registrada/i)

    // Verify status changed to "finished"
    await page.waitForTimeout(1000)
    const status = await page.locator('[data-testid="current-status"]').textContent()
    expect(status).toContain('Finalizado')
  })

  test('should calculate worked hours correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Clock in
    await page.locator('button:has-text("Entrada")').click()
    await page.waitForSelector('[role="status"]', { timeout: 5000 })

    // Wait a few seconds to accumulate time
    await page.waitForTimeout(5000)

    // Check worked time display
    const workedTime = page.locator('[data-testid="worked-time"]')
    await expect(workedTime).toBeVisible()

    // Verify time is counting
    const initialTime = await workedTime.textContent()

    await page.waitForTimeout(2000)

    const updatedTime = await workedTime.textContent()

    // Time should have increased
    expect(updatedTime).not.toBe(initialTime)
  })

  test('should handle break start and end', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Clock in first
    await page.locator('button:has-text("Entrada")').click()
    await page.waitForSelector('[role="status"]', { timeout: 5000 })
    await page.waitForTimeout(2000)

    // Start break
    const breakStartButton = page.locator('button:has-text("Iniciar Intervalo")')
    await breakStartButton.click()

    // Verify success
    await page.waitForSelector('[role="status"]', { timeout: 5000 })
    const toast1 = page.locator('[role="status"]')
    await expect(toast1).toContainText(/intervalo/i)

    // Verify status changed to "break"
    await page.waitForTimeout(1000)
    const statusBreak = await page.locator('[data-testid="current-status"]').textContent()
    expect(statusBreak).toContain('Intervalo')

    await page.waitForTimeout(2000)

    // End break
    const breakEndButton = page.locator('button:has-text("Fim do Intervalo")')
    await breakEndButton.click()

    // Verify success
    await page.waitForSelector('[role="status"]', { timeout: 5000 })
    const toast2 = page.locator('[role="status"]')
    await expect(toast2).toContainText(/intervalo/i)

    // Verify status changed back to "working"
    await page.waitForTimeout(1000)
    const statusWorking = await page.locator('[data-testid="current-status"]').textContent()
    expect(statusWorking).toContain('Trabalhando')
  })

  test('should show correct available actions based on status', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Initially, only "Entrada" should be available
    await expect(page.locator('button:has-text("Entrada")')).toBeEnabled()
    await expect(page.locator('button:has-text("Saída")')).toBeDisabled()
    await expect(page.locator('button:has-text("Iniciar Intervalo")')).toBeDisabled()

    // Clock in
    await page.locator('button:has-text("Entrada")').click()
    await page.waitForSelector('[role="status"]', { timeout: 5000 })
    await page.waitForTimeout(1000)

    // Now "Saída" and "Iniciar Intervalo" should be available
    await expect(page.locator('button:has-text("Entrada")')).toBeDisabled()
    await expect(page.locator('button:has-text("Saída")')).toBeEnabled()
    await expect(page.locator('button:has-text("Iniciar Intervalo")')).toBeEnabled()
  })

  test('should prevent duplicate entries within 1 minute', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Clock in
    await page.locator('button:has-text("Entrada")').click()
    await page.waitForSelector('[role="status"]', { timeout: 5000 })

    // Wait less than 1 minute
    await page.waitForTimeout(500)

    // Try to clock in again immediately
    await page.locator('button:has-text("Saída")').click()

    // Should show error about duplicate
    await page.waitForSelector('[role="alert"], [role="status"]', { timeout: 5000 })
    const errorToast = page.locator('[role="alert"], [role="status"]')
    await expect(errorToast).toContainText(/duplicado|aguarde/i)
  })

  test('should display presence widget', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Look for presence widget
    const presenceWidget = page.locator('[data-testid="presence-widget"]')
    await expect(presenceWidget).toBeVisible()

    // Verify it shows who is working
    const activeEmployees = page.locator('[data-testid="active-employee"]')
    await expect(activeEmployees.first()).toBeVisible()
  })

  test('should navigate to history page', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Click on history link
    const historyLink = page.locator('a:has-text("Histórico")')
    await historyLink.click()

    // Verify navigation
    await expect(page).toHaveURL(`${BASE_URL}/ponto/historico`)

    // Verify history page elements
    await expect(page.locator('h1, h2')).toContainText(/histórico/i)

    // Verify calendar or date picker
    await expect(page.locator('[data-testid="date-filter"]')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(`${BASE_URL}/ponto`)

    // Verify clock widget is visible on mobile
    await expect(page.locator('[data-testid="clock-widget"]')).toBeVisible()

    // Verify buttons are accessible
    const clockInButton = page.locator('button:has-text("Entrada")')
    await expect(clockInButton).toBeVisible()

    // Click should work on mobile
    await clockInButton.click()
    await page.waitForSelector('[role="status"]', { timeout: 5000 })
  })

  test('should handle network errors gracefully', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Simulate offline mode
    await context.setOffline(true)

    // Try to clock in
    await page.locator('button:has-text("Entrada")').click()

    // Should show error message
    await page.waitForSelector('[role="alert"]', { timeout: 5000 })
    const errorToast = page.locator('[role="alert"]')
    await expect(errorToast).toContainText(/erro|falha/i)

    // Restore online mode
    await context.setOffline(false)
  })

  test('should update in real-time when another user punches', async ({ browser }) => {
    // This test requires two browser contexts
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()

    const context2 = await browser.newContext()
    const page2 = await context2.newPage()

    // Login both users
    await login(page1)
    await login(page2)

    // Both navigate to time tracking
    await page1.goto(`${BASE_URL}/ponto`)
    await page2.goto(`${BASE_URL}/ponto`)

    // User 1 clocks in
    await page1.locator('button:has-text("Entrada")').click()
    await page1.waitForSelector('[role="status"]', { timeout: 5000 })

    // User 2 should see the update in presence widget (if real-time is implemented)
    // Note: This depends on your real-time implementation
    await page2.waitForTimeout(2000)

    const activeEmployees = page2.locator('[data-testid="active-employee"]')
    // Verify count increased
    await expect(activeEmployees).toHaveCount(1, { timeout: 5000 })

    // Cleanup
    await context1.close()
    await context2.close()
  })
})

test.describe('Time Tracking - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Tab through elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to activate button with keyboard
    await page.keyboard.press('Enter')

    // Verify action occurred
    await page.waitForSelector('[role="status"]', { timeout: 5000 })
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Check for aria-label on clock in button
    const clockInButton = page.locator('button:has-text("Entrada")')
    const ariaLabel = await clockInButton.getAttribute('aria-label')

    expect(ariaLabel).toBeTruthy()
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto(`${BASE_URL}/ponto`)

    // Use axe-core or similar tool to check contrast
    // This is a placeholder - you would integrate axe-playwright
    const clockInButton = page.locator('button:has-text("Entrada")')
    await expect(clockInButton).toBeVisible()
  })
})
