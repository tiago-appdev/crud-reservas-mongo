import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });

  test('should register a new user successfully', async ({ page }) => {
    // Navigate to register page
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL('/register');

    // Fill registration form
    await page.fill('#name', 'Test User');
    await page.fill('#email', `test${Date.now()}@example.com`);
    await page.fill('#password', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to reservations page
    await expect(page).toHaveURL('/reservations');
    await expect(page.locator('h1')).toContainText('My Reservations');
  });

  test('should login existing user', async ({ page }) => {
    // Navigate to login page
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');

    // Fill login form with seeded user
    await page.fill('#email', 'john@example.com');
    await page.fill('#password', 'client123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to reservations page
    await expect(page).toHaveURL('/reservations');
    await expect(page.locator('h1')).toContainText('My Reservations');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('a[href="/login"]');
    
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    
    // Listen for alert dialog
    page.on('dialog', dialog => dialog.accept());
    
    await page.click('button[type="submit"]');
    
    // Should still be on login page
    await expect(page).toHaveURL('/login');
  });

  test('should logout user', async ({ page }) => {
    // Login first
    await page.click('a[href="/login"]');
    await page.fill('#email', 'john@example.com');
    await page.fill('#password', 'client123');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL('/reservations');

    // Logout
    await page.click('button:has-text("Logout")');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });
});



