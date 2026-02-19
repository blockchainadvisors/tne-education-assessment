/**
 * Pre-authenticated page fixtures per role.
 *
 * Extends Playwright's base `test` with fixtures that provide a `Page`
 * already logged in as a specific role. Uses API login + localStorage
 * injection to skip the login UI for every test.
 */

import { test as base, type Page } from "@playwright/test";
import { API_URL, USERS, type UserKey } from "./test-data";

type AuthFixtures = {
  tenantAdminPage: Page;
  assessorPage: Page;
  reviewerPage: Page;
  platformAdminPage: Page;
};

async function authenticatePage(
  page: Page,
  userKey: UserKey
): Promise<Page> {
  const user = USERS[userKey];

  // Login via API to get tokens
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to login as ${userKey} (${user.email}): ${response.status} ${text}`
    );
  }

  const tokens = await response.json();

  // Navigate to frontend first (needed for localStorage domain)
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // Inject tokens into localStorage
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    },
    {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    }
  );

  return page;
}

export const test = base.extend<AuthFixtures>({
  tenantAdminPage: async ({ page }, use) => {
    await authenticatePage(page, "tenantAdmin");
    await use(page);
  },

  assessorPage: async ({ page }, use) => {
    await authenticatePage(page, "assessor");
    await use(page);
  },

  reviewerPage: async ({ page }, use) => {
    await authenticatePage(page, "reviewer");
    await use(page);
  },

  platformAdminPage: async ({ page }, use) => {
    await authenticatePage(page, "platformAdmin");
    await use(page);
  },
});

export { expect } from "@playwright/test";
