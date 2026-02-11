// e2e/projects.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Project Management', () => {
  let userEmail: string
  let userPassword: string

  test.beforeEach(async ({ page }) => {
    const timestamp = Date.now()
    userEmail = `user${timestamp}@example.com`
    userPassword = 'password123'
    
    // Register
    await page.goto('/register')
    await page.locator('input[name="name"]').fill('Test User')
    await page.locator('input[name="email"]').fill(userEmail)
    await page.locator('input[name="password"]').fill(userPassword)
    await page.locator('input[name="confirmPassword"]').fill(userPassword)
    await page.locator('button[type="submit"]').click()
    
    // Wait for redirect and login
    await page.waitForURL(/\/login/, { timeout: 15000 })
    await page.locator('input[name="email"]').fill(userEmail)
    await page.locator('input[name="password"]').fill(userPassword)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL('/dashboard', { timeout: 15000 })
  })

  test('should create a new project', async ({ page }) => {
    // Find and click the new project button
    const newProjectBtn = page.getByRole('button', { name: /new project/i })
    await newProjectBtn.click()
    
    // Wait for and fill the form
    await page.waitForTimeout(500)
    await page.locator('input').first().fill('My Test Project')
    await page.locator('textarea').first().fill('Test description')
    
    // Submit form
    const createBtn = page.getByRole('button', { name: /create project/i }).last()
    console.log('Button: '+createBtn);
    await createBtn.click()
    
    // Verify project appears
    await page.waitForTimeout(2000)
    await expect(page.getByText('My Test Project')).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to project detail', async ({ page }) => {
    // Create project first
    await page.getByRole('button', { name: /new project/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input').first().fill('Detail Project')
    await page.getByRole('button', { name: /create project/i }).last().click()
    await page.waitForTimeout(2000)
    
    // Click on the project card
    await page.getByText('Detail Project').click()
    await page.waitForTimeout(1000)
    
    // Verify we're on the detail page
    await expect(page).toHaveURL(/\/projects\//, { timeout: 10000 })
  })

  test('should edit a project', async ({ page }) => {
    // Create project
    await page.getByRole('button', { name: /new project/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input').first().fill('Edit Me')
    await page.getByRole('button', { name: /create project/i }).last().click()
    await page.waitForTimeout(2000)
    
    // Go to detail page
    await page.getByText('Edit Me').click()
    await page.waitForTimeout(1000)
    
    // Click edit button
    await page.getByRole('button', { name: /edit/i }).first().click()
    await page.waitForTimeout(500)
    
    // Update project name
    const nameInput = page.locator('input[type="text"]')
    await nameInput.clear()
    await nameInput.fill('Edited Project')
    
    // Save
    await page.getByRole('button', { name: /save/i }).click()
    await page.waitForTimeout(2000)
    
    // Verify update
    await expect(page.getByText('Edited Project')).toBeVisible({ timeout: 30000 })
  })

  test('should delete a project', async ({ page }) => {
    // Create project
    await page.getByRole('button', { name: /new project/i }).click()
    await page.waitForTimeout(500)
    await page.locator('input').first().fill('Delete Me')
    await page.getByRole('button', { name: /create project/i }).last().click()
    await page.waitForTimeout(2000)
    
    // Go to detail page
    await page.getByText('Delete Me').click()
    await page.waitForTimeout(1000)
    
    // Delete project
    await page.getByRole('button', { name: /delete/i }).first().click()
    await page.waitForTimeout(500)
    
    // Confirm deletion
    const deleteConfirmBtn = page.getByRole('button', { name: /delete project/i })
    await deleteConfirmBtn.click()
    await page.waitForTimeout(2000)
    
    // Should be back on dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 30000 })
  })
})