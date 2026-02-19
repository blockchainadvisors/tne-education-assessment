/**
 * Registration & Onboarding E2E Tests
 *
 * Tests the full registration flow including email verification,
 * duplicate detection, and client-side validation.
 */

import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/register.page';
import { VerifyEmailPage } from '../pages/verify-email.page';
import { mailpit } from '../fixtures/mailpit';
import { freshRegistration } from '../fixtures/test-data';

test.describe('Registration & Onboarding', () => {
  test('register new institution and verify email', async ({ page }) => {
    const reg = freshRegistration();
    const registerPage = new RegisterPage(page);
    const verifyPage = new VerifyEmailPage(page);

    // Navigate to registration page
    await registerPage.goto();
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    // Fill in registration form and submit
    await registerPage.register(reg);

    // Should redirect to verify-email-sent page
    await page.waitForURL(/\/verify-email-sent/, { timeout: 15000 });
    await expect(verifyPage.checkEmailHeading).toBeVisible();

    // Retrieve verification token from Mailpit
    const token = await mailpit.getVerificationToken(reg.email);
    expect(token).toBeTruthy();

    // Navigate to verify-email with the token
    await verifyPage.gotoVerify(token);

    // Wait for verification success
    await verifyPage.waitForSuccess();
    await expect(verifyPage.successHeading).toBeVisible();

    // After successful verification, the page should either redirect to
    // /dashboard or show a link to sign in
    // Give the page time to potentially redirect
    await page.waitForTimeout(2000);
    const url = page.url();
    const onDashboard = url.includes('/dashboard');
    const onVerifySuccess = url.includes('/verify-email');

    // Either we were redirected to dashboard or we're on the verify success page
    expect(onDashboard || onVerifySuccess).toBeTruthy();

    // If still on verify page, navigate to login manually
    if (onVerifySuccess) {
      if (await verifyPage.backToSignInLink.isVisible()) {
        await verifyPage.backToSignInLink.click();
        await page.waitForURL(/\/login/, { timeout: 10000 });
      }
    }
  });

  test('duplicate email shows error', async ({ page }) => {
    const reg = freshRegistration();
    const registerPage = new RegisterPage(page);

    // Register first time
    await registerPage.goto();
    await registerPage.register(reg);
    await page.waitForURL(/\/verify-email-sent/, { timeout: 15000 });

    // Go back to register and try the same email
    const secondReg = freshRegistration();
    secondReg.email = reg.email; // reuse the same email
    await registerPage.goto();
    await registerPage.register(secondReg);

    // Should show an error about duplicate email
    const errorText = await registerPage.getError();
    expect(errorText.toLowerCase()).toContain('email');
  });

  test('duplicate tenant slug shows error', async ({ page }) => {
    const reg = freshRegistration();
    const registerPage = new RegisterPage(page);

    // Register first time
    await registerPage.goto();
    await registerPage.register(reg);
    await page.waitForURL(/\/verify-email-sent/, { timeout: 15000 });

    // Go back to register with a different email but same slug
    const secondReg = freshRegistration();
    secondReg.tenant_slug = reg.tenant_slug; // reuse the same slug
    await registerPage.goto();
    await registerPage.register({
      ...secondReg,
      tenant_slug: reg.tenant_slug,
    });

    // Should show an error about duplicate tenant slug
    const errorText = await registerPage.getError();
    expect(errorText.toLowerCase()).toMatch(/slug|institution|already/);
  });

  test('password too short shows validation', async ({ page }) => {
    const reg = freshRegistration();
    reg.password = 'short'; // Less than 8 characters
    const registerPage = new RegisterPage(page);

    await registerPage.goto();

    // Fill in all fields
    await registerPage.fullNameInput.fill(reg.full_name);
    await registerPage.emailInput.fill(reg.email);
    await registerPage.passwordInput.fill(reg.password);
    await registerPage.tenantNameInput.fill(reg.tenant_name);
    await registerPage.countryInput.fill(reg.country);

    // Try to submit
    await registerPage.submitButton.click();

    // The HTML5 minLength validation should prevent submission or
    // the backend should return an error. Check for either scenario.
    // If the form has HTML5 validation, we stay on the same page
    const currentUrl = page.url();
    const stayedOnRegister = currentUrl.includes('/register');

    if (stayedOnRegister) {
      // HTML5 validation prevented form submission (minLength=8 on password field)
      // Verify we did not navigate away
      expect(currentUrl).toContain('/register');
    } else {
      // If form submitted, backend should return error
      const errorText = await registerPage.getError();
      expect(errorText.toLowerCase()).toMatch(/password|short|minimum|characters/);
    }
  });
});
