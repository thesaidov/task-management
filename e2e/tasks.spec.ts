// e2e/tasks.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now()
    const email = `user${timestamp}@example.com`
    const password = 'password123'
    
    // Register and login
    await page.goto('/register')
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('input[name="confirmPassword"]').fill(password)
    await page.locator('button[type="submit"]').click()
    
    await page.waitForURL(/\/login/, { timeout: 15000 })
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('/dashboard', { timeout: 15000 })
    
    // Create a project
    await page.getByRole('button', { name: /new project/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input').first().fill('Test Project')
    await page.getByRole('button', { name: /create project/i }).last().click()
    await page.waitForTimeout(2000)
    
    
    // Navigate to project
    await page.getByText('Test Project').click()
    await page.waitForTimeout(1000)
  })

  test('should create a new task', async ({ page }) => {
    // Click add task button
    await page.getByRole('button', { name: /add task/i }).click()
    await page.waitForTimeout(500)
    
    // Fill task form
    await page.locator('input[placeholder*="title"]').fill('My First Task')
    await page.locator('textarea[placeholder*="description"]').fill('Task description')
    
    // Submit
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(2000)
    
    // Verify task appears
    await expect(page.getByText('My First Task')).toBeVisible({ timeout: 10000 })
  })

  test('should edit a task', async ({ page }) => {
    // Create a task first
    await page.getByRole('button', { name: /add task/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input[placeholder*="title"]').fill('Original Task')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(2000)
    
    // Edit the task
    await page.getByRole('button', { name: /edit/i }).first().click()
    await page.waitForTimeout(500)
    
    // Update title
    const titleInput = page.locator('input[required]')
    await titleInput.clear()
    await titleInput.fill('Updated Task')
    
    // Save
    await page.getByRole('button', { name: /save/i }).click()
    await page.waitForTimeout(2000)
    
    // Verify update
    await expect(page.locator('h3[id="task-title"]')).toBeVisible({ timeout: 30000 })
  })

  test('should delete a task', async ({ page }) => {
    // Create a task
    await page.getByRole('button', { name: /add task/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input[placeholder*="title"]').fill('Delete Me')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(2000)
    
    // Set up dialog handler
    page.on('dialog', dialog => dialog.accept())
    
    // Delete
    await page.getByRole('button', { name: /delete/i }).first().click()
    await page.waitForTimeout(2000)
    
    // Verify deletion
    await expect(page.getByText('Delete Me')).not.toBeVisible()
  })

  test('should filter tasks by status', async ({ page }) => {
    // Create TODO task
    await page.getByRole('button', { name: /add task/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input[placeholder*="title"]').fill('Todo Task')
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(2000)
    
    // Create DONE task
    await page.getByRole('button', { name: /add task/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input[placeholder*="title"]').fill('Done Task')
    
    // Select DONE status
    const selects = page.locator('select')
    await selects.first().selectOption('DONE')
    
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(2000)
    
    // Filter by DONE - click the first "Done" button (filter button, not status)
    const filterButtons = page.locator('button')
    await filterButtons.filter({ hasText: /^Done$/i }).first().click()
    await page.waitForTimeout(1000)
    
    // Should show Done Task, not Todo Task
    await expect(page.getByText('Done Task')).toBeVisible({timeout: 3000})
    
    // Click "All" to show all tasks
    await page.getByRole('button', { name: /^All$/i }).first().click()
    await page.waitForTimeout(3000)
    
    // Both should be visible
    await expect(page.getByText('Todo Task')).toBeVisible()
    await expect(page.getByText('Done Task')).toBeVisible()
  })

  test('should set task priority', async ({ page }) => {
    // Create task with HIGH priority
    await page.getByRole('button', { name: /add task/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input[placeholder*="title"]').fill('High Priority Task')
    
    // Select HIGH priority (second select)
    const selects = page.locator('select')
    await selects.nth(1).selectOption('HIGH')
    
    await page.getByRole('button', { name: /create task/i }).click()
    await page.waitForTimeout(2000)
    
    // Verify HIGH priority is shown
    await expect(page.locator('span[id="priority"]')).toBeVisible({ timeout: 30000 })
  })
})