/**
 * User Management E2E Tests
 *
 * Tests user CRUD operations, role-based access control, and
 * duplicate email detection via direct API calls.
 */

import { test, expect } from '@playwright/test';
import { api } from '../fixtures/api-seeder';
import { USERS } from '../fixtures/test-data';

test.describe('User Management', () => {
  let adminToken: string;

  test.beforeAll(async () => {
    adminToken = await api.getToken('tenantAdmin');
  });

  test('list tenant users', async () => {
    const users = await api.listUsers(adminToken);

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(1);

    // Verify seeded users are present
    const emails = users.map((u) => u.email);
    expect(emails).toContain(USERS.tenantAdmin.email);

    // Each user should have expected fields
    for (const user of users) {
      expect(user.id).toBeTruthy();
      expect(user.email).toBeTruthy();
      expect(user.role).toBeTruthy();
    }
  });

  test('create new assessor user', async () => {
    const ts = Date.now();
    const userData = {
      email: `e2e-new-assessor-${ts}@test.local`,
      password: 'TestPass123!',
      full_name: `New Assessor ${ts}`,
      role: 'assessor',
    };

    const created = await api.createUser(adminToken, userData);

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();
    expect(created.email).toBe(userData.email);
    expect(created.role).toBe('assessor');
  });

  test('create new reviewer user', async () => {
    const ts = Date.now();
    const userData = {
      email: `e2e-new-reviewer-${ts}@test.local`,
      password: 'TestPass123!',
      full_name: `New Reviewer ${ts}`,
      role: 'reviewer',
    };

    const created = await api.createUser(adminToken, userData);

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();
    expect(created.email).toBe(userData.email);
    expect(created.role).toBe('reviewer');
  });

  test('update user role', async () => {
    const ts = Date.now();

    // Create a user with assessor role
    const created = await api.createUser(adminToken, {
      email: `e2e-role-change-${ts}@test.local`,
      password: 'TestPass123!',
      full_name: `Role Change User ${ts}`,
      role: 'assessor',
    });
    expect(created.role).toBe('assessor');

    // Update to reviewer role
    const updated = await api.updateUser(adminToken, created.id, {
      role: 'reviewer',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.role).toBe('reviewer');
  });

  test('duplicate email returns 409', async () => {
    // Try to create a user with an email that already exists (seeded tenantAdmin)
    const response = await api.rawRequest('POST', '/users', {
      token: adminToken,
      body: {
        email: USERS.tenantAdmin.email,
        password: 'TestPass123!',
        full_name: 'Duplicate User',
        role: 'assessor',
      },
    });

    expect(response.status).toBe(409);
    const detail = (response.body as Record<string, string>).detail;
    expect(detail).toContain('Email already registered');
  });

  test('non-admin cannot manage users', async () => {
    // Login as assessor (non-admin role)
    const assessorToken = await api.getToken('assessor');

    // Try to list users — should get 403
    const listResponse = await api.rawRequest('GET', '/users', {
      token: assessorToken,
    });

    expect(listResponse.status).toBe(403);

    // Try to create a user — should also get 403
    const createResponse = await api.rawRequest('POST', '/users', {
      token: assessorToken,
      body: {
        email: `unauthorized-${Date.now()}@test.local`,
        password: 'TestPass123!',
        full_name: 'Unauthorized User',
        role: 'assessor',
      },
    });

    expect(createResponse.status).toBe(403);
  });
});
