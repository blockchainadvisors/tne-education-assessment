/**
 * Benchmarking E2E Tests
 *
 * Tests the benchmarking page UI and benchmark comparison API.
 * In Phase 1, the benchmarks page shows an insufficient peer data
 * message since not enough institutions have submitted assessments.
 */

import { test, expect } from '../fixtures/auth.fixture';
import { test as base, expect as baseExpect } from '@playwright/test';
import { api } from '../fixtures/api-seeder';
import { ACADEMIC_YEAR } from '../fixtures/test-data';

test.describe('Benchmarking - UI', () => {
  test('benchmarks page shows insufficient data message', async ({
    tenantAdminPage,
  }) => {
    const page = tenantAdminPage;

    await page.goto('/benchmarks', { waitUntil: 'networkidle' });

    // The benchmarks page should display an "Insufficient Peer Data" empty state
    const insufficientDataText = page.getByText('Insufficient Peer Data');
    await expect(insufficientDataText).toBeVisible({ timeout: 10000 });
  });

  test('benchmarks page shows phase 1 alert', async ({
    tenantAdminPage,
  }) => {
    const page = tenantAdminPage;

    await page.goto('/benchmarks', { waitUntil: 'networkidle' });

    // The page should show a Phase 1 informational alert
    const phaseAlert = page.getByText('Phase 1');
    await expect(phaseAlert).toBeVisible({ timeout: 10000 });

    // Verify the alert contains information about benchmark activation
    const alertContent = page.locator('text=Benchmarking features will be fully activated');
    await expect(alertContent).toBeVisible();
  });
});

base.describe('Benchmarking - API', () => {
  let token: string;

  base.beforeAll(async () => {
    token = await api.getToken('tenantAdmin');
  });

  base('benchmark comparison API', async () => {
    // Get or create an assessment for benchmarking
    let assessmentId: string;

    try {
      // Try to find an existing assessment first
      const assessments = await api.listAssessments(token);
      if (assessments.length > 0) {
        assessmentId = assessments[0].id;
      } else {
        // Create a new assessment
        const templates = await api.getTemplates(token);
        if (templates.length === 0) {
          base.skip(true, 'No templates available to create assessment');
          return;
        }
        const assessment = await api.createAssessment(
          token,
          templates[0].id,
          ACADEMIC_YEAR
        );
        assessmentId = assessment.id;
      }
    } catch {
      base.skip(true, 'Could not create or find assessment for benchmarking');
      return;
    }

    // Call the benchmark comparison endpoint
    const response = await api.rawRequest(
      'GET',
      `/benchmarks/compare/${assessmentId}`,
      { token }
    );

    // Should return 200 even if metrics are empty (valid assessment, no peer data)
    baseExpect(response.status).toBe(200);

    const body = response.body as {
      academic_year?: string;
      metrics?: unknown[];
      country?: string | null;
    };

    baseExpect(body).toBeDefined();
    baseExpect(body.academic_year).toBeTruthy();
    baseExpect(Array.isArray(body.metrics)).toBe(true);
    // Metrics may be empty in Phase 1 — that is expected
  });
});
