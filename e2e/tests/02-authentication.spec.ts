/**
 * Authentication E2E Tests
 *
 * Tests login flows (password + magic link), logout, error handling,
 * and protected route redirects.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { RegisterPage } from '../pages/register.page';
import { mailpit } from '../fixtures/mailpit';
import { USERS, freshRegistration } from '../fixtures/test-data';

test.describe('Authentication', () => {
  test('login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible();

    await loginPage.loginWithPassword(
      USERS.tenantAdmin.email,
      USERS.tenantAdmin.password
    );

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('login with invalid password shows error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.loginWithPassword(
      USERS.tenantAdmin.email,
      'WrongPassword999!'
    );

    // Should show error message
    const errorText = await loginPage.getError();
    expect(errorText.toLowerCase()).toMatch(/invalid|incorrect|wrong|credentials/);
  });

  test('login with unverified email shows error', async ({ page }) => {
    // Register a new user (unverified) first
    const reg = freshRegistration();
    const registerPage = new RegisterPage(page);

    await registerPage.goto();
    await registerPage.register(reg);
    await page.waitForURL(/\/verify-email-sent/, { timeout: 15000 });

    // Now try to login with the unverified account
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithPassword(reg.email, reg.password);

    // Should show error about email not being verified
    const errorText = await loginPage.getError();
    expect(errorText.toLowerCase()).toMatch(/not verified|verify|verification/);
  });

  test('magic link login flow', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Switch to Magic Link tab and request a link
    await loginPage.requestMagicLink(USERS.tenantAdmin.email);

    // Should show success message
    const message = await loginPage.getMessage();
    expect(message.toLowerCase()).toMatch(/sent|check|email|link/);

    // Get the magic link token from Mailpit
    const token = await mailpit.getMagicLinkToken(USERS.tenantAdmin.email);
    expect(token).toBeTruthy();

    // Navigate to the magic link URL
    await page.goto(`/magic-link?token=${encodeURIComponent(token)}`);

    // Should redirect to dashboard after magic link authentication
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('logout clears tokens', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // First, login
    await loginPage.goto();
    await loginPage.loginWithPassword(
      USERS.tenantAdmin.email,
      USERS.tenantAdmin.password
    );
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Verify tokens are set in localStorage
    const accessToken = await page.evaluate(() =>
      localStorage.getItem('access_token')
    );
    expect(accessToken).toBeTruthy();

    // Open user menu (click the user avatar/button area)
    const userMenuButton = page.locator('button[aria-haspopup="true"]');
    await userMenuButton.click();

    // Click "Sign out"
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Should redirect to /login
    await page.waitForURL(/\/login/, { timeout: 15000 });
    expect(page.url()).toContain('/login');

    // Verify localStorage tokens are cleared
    const clearedToken = await page.evaluate(() =>
      localStorage.getItem('access_token')
    );
    expect(clearedToken).toBeNull();
  });

  test('protected route redirects to login', async ({ page }) => {
    // Clear any existing tokens by evaluating on the target domain first
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    });

    // Try to navigate to a protected route without authentication
    await page.goto('/dashboard');

    // Should redirect to /login
    await page.waitForURL(/\/login/, { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });
});
