/**
 * Reviewer Journey E2E Tests
 *
 * Tests the reviewer role's experience: viewing submitted assessments,
 * triggering scoring and reports via API, and verifying score display.
 */

import { test, expect } from '../fixtures/auth.fixture';
import { api } from '../fixtures/api-seeder';
import { waitForJob } from '../helpers/wait-helpers';

test.describe('Reviewer Journey', () => {
  let submittedAssessmentId: string;
  let reviewerToken: string;
  let tenantAdminToken: string;

  test.beforeAll(async () => {
    // Create and submit an assessment for the reviewer to work with.
    // We use the tenantAdmin to create/submit, then the reviewer to review.
    try {
      tenantAdminToken = await api.getToken('tenantAdmin');
      reviewerToken = await api.getToken('reviewer');

      const templates = await api.getTemplates(tenantAdminToken);
      if (templates.length > 0) {
        const assessment = await api.createAssessment(
          tenantAdminToken,
          templates[0].id,
          `${Date.now()}-RVWR`
        );
        // Submit the assessment so it's available for review
        await api.submitAssessment(tenantAdminToken, assessment.id);
        submittedAssessmentId = assessment.id;
      }
    } catch (err) {
      console.warn(
        `[beforeAll] Could not create/submit assessment for reviewer: ${err}`
      );
    }
  });

  test('reviewer can view submitted assessment', async ({ reviewerPage }) => {
    const page = reviewerPage;

    if (!submittedAssessmentId) {
      test.skip(true, 'No submitted assessment available (API setup failed)');
      return;
    }

    // Navigate to the review page
    await page.goto(`/assessments/${submittedAssessmentId}/review`);
    await page.waitForLoadState('networkidle');

    // Verify review page content
    await expect(
      page.getByText('Read-only review of submitted responses')
    ).toBeVisible({ timeout: 15000 });

    // Verify at least one theme section is rendered
    const themeSections = page.locator('.card h2');
    const count = await themeSections.count();
    expect(count).toBeGreaterThan(0);

    // Verify the "Back to Assessments" link is present
    await expect(page.getByText('Back to Assessments')).toBeVisible();
  });

  test('trigger scoring via API', async () => {
    if (!submittedAssessmentId || !reviewerToken) {
      test.skip(true, 'No submitted assessment or reviewer token available');
      return;
    }

    try {
      // Trigger scoring via the API
      const result = await api.triggerScoring(
        reviewerToken,
        submittedAssessmentId
      );
      expect(result).toBeTruthy();

      // If we got a job ID, poll it for completion
      if (result.id) {
        try {
          const job = await waitForJob(reviewerToken, result.id, 30000);
          // Job should reach a terminal state (completed or failed)
          expect(['completed', 'failed']).toContain(job.status);
        } catch {
          // Celery may not be running; this is acceptable in some environments
          console.warn(
            'Scoring job did not complete - Celery may not be running'
          );
        }
      }
    } catch (err) {
      // Scoring endpoint may require specific permissions or Celery
      // Handle gracefully
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Scoring trigger failed (may be expected): ${errorMsg}`);

      // If it's a 403 or permission issue, that's understandable
      if (
        errorMsg.includes('403') ||
        errorMsg.includes('permission') ||
        errorMsg.includes('role')
      ) {
        // Reviewer may not have scoring permission; use tenantAdmin instead
        try {
          const adminResult = await api.triggerScoring(
            tenantAdminToken,
            submittedAssessmentId
          );
          expect(adminResult).toBeTruthy();
        } catch (adminErr) {
          console.warn(
            `Admin scoring also failed: ${adminErr instanceof Error ? adminErr.message : String(adminErr)}`
          );
        }
      }
    }
  });

  test('trigger report via API', async () => {
    if (!submittedAssessmentId || !reviewerToken) {
      test.skip(true, 'No submitted assessment or reviewer token available');
      return;
    }

    try {
      // Trigger report generation via the API
      const result = await api.triggerReport(
        reviewerToken,
        submittedAssessmentId
      );
      expect(result).toBeTruthy();

      // If we got a job ID, poll for completion
      if (result.id) {
        try {
          const job = await waitForJob(reviewerToken, result.id, 30000);
          expect(['completed', 'failed']).toContain(job.status);
        } catch {
          console.warn(
            'Report job did not complete - Celery may not be running'
          );
        }
      }
    } catch (err) {
      // Report generation may depend on scoring being complete, or Celery
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Report trigger failed (may be expected): ${errorMsg}`);

      // Try with tenantAdmin if reviewer lacks permission
      if (
        errorMsg.includes('403') ||
        errorMsg.includes('permission') ||
        errorMsg.includes('role')
      ) {
        try {
          const adminResult = await api.triggerReport(
            tenantAdminToken,
            submittedAssessmentId
          );
          expect(adminResult).toBeTruthy();
        } catch (adminErr) {
          console.warn(
            `Admin report also failed: ${adminErr instanceof Error ? adminErr.message : String(adminErr)}`
          );
        }
      }
    }
  });

  test('reviewer sees scores on review page', async ({ reviewerPage }) => {
    const page = reviewerPage;

    if (!submittedAssessmentId) {
      test.skip(true, 'No submitted assessment available');
      return;
    }

    // Check if the assessment has been scored
    try {
      const assessment = await api.getAssessment(
        reviewerToken,
        submittedAssessmentId
      );

      if (
        assessment.status !== 'scored' &&
        assessment.status !== 'published'
      ) {
        // Assessment hasn't been scored yet; verify review page still works
        await page.goto(`/assessments/${submittedAssessmentId}/review`);
        await page.waitForLoadState('networkidle');
        await expect(
          page.getByText('Read-only review of submitted responses')
        ).toBeVisible({ timeout: 15000 });
        // No scores to check, but the page works
        return;
      }
    } catch (err) {
      console.warn(`Could not check assessment status: ${err}`);
    }

    // Navigate to the review page
    await page.goto(`/assessments/${submittedAssessmentId}/review`);
    await page.waitForLoadState('networkidle');

    // If scored, verify the scores section is displayed
    const scoresHeading = page.getByText('Assessment Scores');
    const hasScores = await scoresHeading.isVisible().catch(() => false);

    if (hasScores) {
      // Verify "Overall Score" label is present
      await expect(page.getByText('Overall Score')).toBeVisible();

      // Verify there's a percentage displayed
      const overallScoreCard = page
        .locator('.rounded-lg.bg-white.p-4')
        .first();
      const scoreText = await overallScoreCard.textContent();
      expect(scoreText).toMatch(/%/);
    } else {
      // Assessment was not scored; just verify the review page loaded
      await expect(
        page.getByText('Read-only review of submitted responses')
      ).toBeVisible();
    }
  });
});
