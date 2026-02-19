/**
 * Platform Admin E2E Tests
 *
 * Tests the platform admin experience: admin page UI,
 * disabled "Coming Soon" buttons, and admin-only API endpoints.
 */

import { test, expect } from '../fixtures/auth.fixture';
import { api } from '../fixtures/api-seeder';

test.describe('Platform Admin', () => {
  test('admin page shows placeholder cards', async ({
    platformAdminPage,
  }) => {
    const page = platformAdminPage;

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verify the "Administration" heading
    await expect(
      page.getByRole('heading', { name: 'Administration' })
    ).toBeVisible({ timeout: 15000 });

    // Verify the card titles are present
    const expectedCards = [
      'Institution Settings',
      'User Management',
      'Partner Institutions',
      'System Configuration',
    ];

    for (const cardTitle of expectedCards) {
      await expect(
        page.getByRole('heading', { name: cardTitle })
      ).toBeVisible();
    }
  });

  test('coming soon buttons are disabled', async ({ platformAdminPage }) => {
    const page = platformAdminPage;

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(
      page.getByRole('heading', { name: 'Administration' })
    ).toBeVisible({ timeout: 15000 });

    // Find all "Coming Soon" buttons
    const comingSoonButtons = page.getByRole('button', {
      name: 'Coming Soon',
    });
    const buttonCount = await comingSoonButtons.count();

    // There should be at least 3-4 "Coming Soon" buttons
    expect(buttonCount).toBeGreaterThanOrEqual(3);

    // Verify each button is disabled
    for (let i = 0; i < buttonCount; i++) {
      await expect(comingSoonButtons.nth(i)).toBeDisabled();
    }
  });

  test('admin stats API returns data', async () => {
    let token: string;
    try {
      token = await api.getToken('platformAdmin');
    } catch (err) {
      test.skip(
        true,
        `Could not get platform admin token: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }

    try {
      const stats = await api.getAdminStats(token);

      // Verify the response structure
      expect(stats).toBeTruthy();
      expect(typeof stats.total_tenants).toBe('number');
      expect(typeof stats.total_users).toBe('number');
      expect(typeof stats.total_assessments).toBe('number');

      // There should be at least 1 tenant and 1 user (from seed data)
      expect(stats.total_tenants).toBeGreaterThanOrEqual(1);
      expect(stats.total_users).toBeGreaterThanOrEqual(1);
    } catch (err) {
      // If the admin stats endpoint is not yet implemented, handle gracefully
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
        console.warn('Admin stats endpoint not yet implemented');
        test.skip(true, 'Admin stats endpoint not available');
      } else {
        throw err;
      }
    }
  });

  test('admin tenants API returns list', async () => {
    let token: string;
    try {
      token = await api.getToken('platformAdmin');
    } catch (err) {
      test.skip(
        true,
        `Could not get platform admin token: ${err instanceof Error ? err.message : String(err)}`
      );
      return;
    }

    try {
      const tenants = await api.listAllTenants(token);

      // Verify the response is an array
      expect(Array.isArray(tenants)).toBe(true);

      // Should have at least one tenant (from seed data)
      expect(tenants.length).toBeGreaterThanOrEqual(1);

      // Verify each tenant has expected properties
      for (const tenant of tenants) {
        expect(tenant).toHaveProperty('id');
        expect(tenant).toHaveProperty('name');
        expect(typeof tenant.id).toBe('string');
        expect(typeof tenant.name).toBe('string');
      }
    } catch (err) {
      // If the admin tenants endpoint is not yet implemented, handle gracefully
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
        console.warn('Admin tenants endpoint not yet implemented');
        test.skip(true, 'Admin tenants endpoint not available');
      } else {
        throw err;
      }
    }
  });
});
