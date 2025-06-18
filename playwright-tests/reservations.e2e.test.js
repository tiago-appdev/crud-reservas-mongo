import { test, expect } from '@playwright/test';

test.describe('Reservations Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'john@example.com');
    await page.fill('#password', 'client123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/reservations');
  });

  test('should create a new reservation', async ({ page }) => {
    // Go to tables page to make a reservation
    await page.click('a[href="/tables"]');
    await expect(page).toHaveURL('/tables');

    // Fill search form
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];

    await page.fill('#date', dateString);
    await page.selectOption('#time', '18:00');
    await page.fill('#party_size', '2');

    // Search for tables
    await page.click('button[type="submit"]');

    // Wait for results and click reserve button
    await page.waitForSelector('.reserve-btn', { timeout: 5000 });
    await page.click('.reserve-btn');

    // Should be on create reservation page
    await expect(page.locator('h1')).toContainText('Create Reservation');

    // Form should be pre-filled, just submit
    await page.click('button[type="submit"]');

    // Listen for success alert
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Confirmación enviada por email');
      dialog.accept();
    });

    // Should redirect back to reservations
    await expect(page).toHaveURL('/reservations');
  });

  test('should display existing reservations', async ({ page }) => {
    // Check if reservations are displayed
    const reservationCards = page.locator('.card');
    await expect(reservationCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should edit a reservation', async ({ page }) => {
    // Wait for reservations to load
    await page.waitForSelector('.card', { timeout: 5000 });
    
    // Click edit button on first reservation
    await page.click('a:has-text("Edit")');

    // Should be on edit page
    await expect(page.locator('h1')).toContainText('Edit Reservation');

    // Change guest count
    await page.fill('#guests', '3');

    // Submit changes
    await page.click('button[type="submit"]');

    // Should redirect back to reservations
    await expect(page).toHaveURL('/reservations');
  });

  test('should cancel a reservation', async ({ page }) => {
    // Wait for reservations to load
    await page.waitForSelector('.card', { timeout: 5000 });

    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());

    // Click cancel button
    await page.click('button:has-text("Cancel")');

    // Page should reload
    await page.waitForLoadState('networkidle');
  });
});
