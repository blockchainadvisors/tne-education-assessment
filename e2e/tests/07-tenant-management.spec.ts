/**
 * Tenant Management E2E Tests
 *
 * Tests tenant CRUD operations and partner institution management
 * via direct API calls. Verifies tenant settings, partner limits,
 * and data integrity.
 */

import { test, expect } from '@playwright/test';
import { api } from '../fixtures/api-seeder';
import { TENANT } from '../fixtures/test-data';

test.describe('Tenant Management', () => {
  let token: string;

  test.beforeAll(async () => {
    token = await api.getToken('tenantAdmin');
  });

  test('get current tenant', async () => {
    const tenant = await api.getCurrentTenant(token);

    expect(tenant).toBeDefined();
    expect(tenant.id).toBeTruthy();
    expect(tenant.name).toBe(TENANT.name);
    expect(tenant.slug).toBe(TENANT.slug);
  });

  test('update tenant settings', async () => {
    const newInstitutionType = `research-university-${Date.now()}`;

    // Update the tenant with a new institution_type
    const updated = await api.updateCurrentTenant(token, {
      institution_type: newInstitutionType,
    });

    expect(updated).toBeDefined();
    expect(updated.id).toBeTruthy();

    // GET again to confirm the change persisted
    const fetched = await api.getCurrentTenant(token) as Record<string, unknown>;
    expect(fetched.institution_type).toBe(newInstitutionType);
  });

  test('list partners', async () => {
    const partners = await api.listPartners(token);

    expect(Array.isArray(partners)).toBe(true);
    // May contain seed data or be empty — just verify array structure
    for (const partner of partners) {
      expect(partner.id).toBeTruthy();
      expect(partner.name).toBeTruthy();
      expect(partner.country).toBeTruthy();
    }
  });

  test('create partner', async () => {
    const partnerData = {
      name: `Test Partner ${Date.now()}`,
      country: 'Singapore',
      position: 99,
    };

    const created = await api.createPartner(token, partnerData);

    expect(created).toBeDefined();
    expect(created.id).toBeTruthy();
    expect(created.name).toBe(partnerData.name);

    // Verify the partner appears in the list
    const partners = await api.listPartners(token);
    const found = partners.find((p) => p.id === created.id);
    expect(found).toBeDefined();

    // Clean up
    await api.deletePartner(token, created.id);
  });

  test('enforce max 5 partners', async () => {
    // First, get current partners to understand existing state
    const existingPartners = await api.listPartners(token);

    // Create partners to reach the limit of 5
    const createdIds: string[] = [];
    const slotsNeeded = 5 - existingPartners.length;

    for (let i = 0; i < slotsNeeded; i++) {
      const partner = await api.createPartner(token, {
        name: `Limit Test Partner ${Date.now()}-${i}`,
        country: 'Malaysia',
        position: 90 + i,
      });
      createdIds.push(partner.id);
    }

    // Verify we now have exactly 5
    const partnersAtLimit = await api.listPartners(token);
    expect(partnersAtLimit.length).toBe(5);

    // Attempt to create a 6th partner — should fail with 400
    const response = await api.rawRequest('POST', '/tenants/current/partners', {
      token,
      body: {
        name: `Overflow Partner ${Date.now()}`,
        country: 'Thailand',
        position: 99,
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toBeDefined();
    const detail = (response.body as Record<string, string>).detail;
    expect(detail).toContain('Maximum');

    // Clean up created partners
    for (const id of createdIds) {
      await api.deletePartner(token, id);
    }
  });

  test('delete partner', async () => {
    // Create a partner to delete
    const partnerData = {
      name: `Delete Me Partner ${Date.now()}`,
      country: 'Japan',
      position: 98,
    };
    const created = await api.createPartner(token, partnerData);
    expect(created.id).toBeTruthy();

    // Verify it exists in the list
    let partners = await api.listPartners(token);
    let found = partners.find((p) => p.id === created.id);
    expect(found).toBeDefined();

    // Delete the partner
    await api.deletePartner(token, created.id);

    // Verify it is no longer in the active list
    partners = await api.listPartners(token);
    found = partners.find((p) => p.id === created.id);
    expect(found).toBeUndefined();
  });
});
