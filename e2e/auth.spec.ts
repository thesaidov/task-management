// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display home page', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.locator('h1')).toContainText('Task Management App')
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
  })

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Get Started')
    await expect(page).toHaveURL('/register')
    await expect(page.locator('h2')).toContainText('Create your account')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Sign In')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('h2')).toContainText('Sign in to your account')
  })

  test('should register a new user', async ({ page }) => {
    await page.goto('/register')
    
    const timestamp = Date.now()
    const email = `test${timestamp}@example.com`
    
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    
    await page.click('button[type="submit"]')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register')
    
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    // First register a user
    const timestamp = Date.now()
    const email = `user${timestamp}@example.com`
    const password = 'password123'
    
    await page.goto('/register')
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.fill('input[name="confirmPassword"]', password)
    await page.click('button[type="submit"]')
    
    // Wait for redirect to login
    await page.waitForURL(/\/login/, { timeout: 10000 })
    
    // Now login
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.locator('h1')).toContainText('Task Management App')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})