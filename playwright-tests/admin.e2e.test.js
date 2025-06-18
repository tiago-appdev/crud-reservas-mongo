import { test, expect } from '@playwright/test';
test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3000/login');
    await page.fill('#email', 'admin@restaurant.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Check if statistics cards are visible
    await expect(page.locator('#totalTables')).toBeVisible();
    await expect(page.locator('#availableTables')).toBeVisible();
    await expect(page.locator('#todayReservations')).toBeVisible();
    await expect(page.locator('#totalReservations')).toBeVisible();
  });

  test('should manage tables', async ({ page }) => {
    // Check table management section
    await expect(page.locator('#tablesTable')).toBeVisible();

    // Select first table checkbox
    await page.click('.table-checkbox:first-child');

    // Click bulk update button
    page.on('dialog', dialog => dialog.accept()); // Accept confirmation
    await page.click('#bulkUpdateBtn');

    // Page should reload
    await page.waitForLoadState('networkidle');
  });

  test('should view recent reservations', async ({ page }) => {
    // Check reservations table
    await expect(page.locator('#reservationsTable')).toBeVisible();

    // Check if reservation rows exist
    const reservationRows = page.locator('#reservationsTable tbody tr');
    await expect(reservationRows.first()).toBeVisible({ timeout: 5000 });
  });
});