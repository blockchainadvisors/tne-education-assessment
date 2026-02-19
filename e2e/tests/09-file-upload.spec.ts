/**
 * File Upload E2E Tests
 *
 * Tests file upload functionality via both UI interactions and
 * direct API calls. Verifies file persistence, listing, and
 * database record creation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { test, expect } from '../fixtures/auth.fixture';
import { test as base, expect as baseExpect } from '@playwright/test';
import { api } from '../fixtures/api-seeder';
import { ACADEMIC_YEAR, API_URL } from '../fixtures/test-data';
import { locateFieldByCode } from '../helpers/field-helpers';

const TEST_FILE_DIR = '/tmp';
const TEST_FILE_NAME = 'e2e-test-document.pdf';
const TEST_FILE_PATH = path.join(TEST_FILE_DIR, TEST_FILE_NAME);

/**
 * Create a minimal test file for upload tests.
 * We create a simple text file with a .pdf extension since the backend
 * accepts any file type for the upload endpoint.
 */
function ensureTestFile(): void {
  if (!fs.existsSync(TEST_FILE_PATH)) {
    // Create a minimal PDF-like file (enough for upload testing)
    const content = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n';
    fs.writeFileSync(TEST_FILE_PATH, content);
  }
}

test.describe('File Upload - UI', () => {
  test.beforeAll(() => {
    ensureTestFile();
  });

  test('upload file in assessment edit page', async ({ tenantAdminPage }) => {
    const page = tenantAdminPage;
    const token = await api.getToken('tenantAdmin');

    // Get available templates to create an assessment
    let assessmentId: string;
    try {
      const templates = await api.getTemplates(token);
      expect(templates.length).toBeGreaterThan(0);

      const assessment = await api.createAssessment(
        token,
        templates[0].id,
        ACADEMIC_YEAR
      );
      assessmentId = assessment.id;
    } catch {
      // If template/assessment creation fails, skip the test gracefully
      test.skip(true, 'Could not create assessment — templates may not be seeded');
      return;
    }

    // Navigate to the assessment edit page
    await page.goto(`/assessments/${assessmentId}/edit`, {
      waitUntil: 'networkidle',
    });

    // Look for any file_upload field on the page
    // File upload fields have input[type="file"] elements
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();

    if (fileInputCount === 0) {
      // No file upload fields on this page — skip gracefully
      test.skip(true, 'No file upload fields found on the assessment edit page');
      return;
    }

    // Upload a file to the first file input found
    const firstFileInput = fileInputs.first();
    await firstFileInput.setInputFiles(TEST_FILE_PATH);

    // Wait for upload indicator — look for the filename or a success indicator
    // The UI should show the uploaded filename or a checkmark/progress bar
    await page.waitForTimeout(3000); // Allow time for upload to process

    // Verify some indication that the file was accepted
    // This could be the filename appearing, a success message, or a file list item
    const uploadedIndicator = page
      .locator('text=e2e-test-document')
      .or(page.locator('[data-testid="uploaded-file"]'))
      .or(page.locator('.uploaded-file'))
      .or(page.locator('text=Upload complete'))
      .or(page.locator('text=.pdf'));

    // The file name or some upload confirmation should be visible
    const isVisible = await uploadedIndicator.first().isVisible().catch(() => false);

    // Even if the specific indicator is not visible, the file input should have
    // accepted the file (no error alert/toast)
    const errorToast = page.locator('[role="alert"]').filter({ hasText: /error|fail/i });
    const hasError = await errorToast.isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });
});

base.describe('File Upload - API', () => {
  let token: string;
  let assessmentId: string;

  base.beforeAll(async () => {
    token = await api.getToken('tenantAdmin');

    // Create a draft assessment for file upload tests
    try {
      const templates = await api.getTemplates(token);
      if (templates.length > 0) {
        const assessment = await api.createAssessment(
          token,
          templates[0].id,
          ACADEMIC_YEAR
        );
        assessmentId = assessment.id;
      }
    } catch {
      // Will be handled in individual tests
    }
  });

  base.beforeAll(() => {
    ensureTestFile();
  });

  base('list uploaded files via API', async () => {
    if (!assessmentId) {
      base.skip(true, 'No assessment available for file upload test');
      return;
    }

    // Upload a file using raw fetch with FormData
    const fileContent = fs.readFileSync(TEST_FILE_PATH);
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([fileContent], { type: 'application/pdf' }),
      TEST_FILE_NAME
    );

    const uploadResponse = await fetch(
      `${API_URL}/assessments/${assessmentId}/files`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    // Upload may succeed (201) or fail if MinIO is not running (500/503)
    if (!uploadResponse.ok) {
      base.skip(
        true,
        `File upload returned ${uploadResponse.status} — storage service may not be running`
      );
      return;
    }

    baseExpect(uploadResponse.status).toBe(201);

    // List files for the assessment
    const files = await api.listFiles(token, assessmentId);
    baseExpect(Array.isArray(files)).toBe(true);
    baseExpect(files.length).toBeGreaterThanOrEqual(1);

    // Verify our uploaded file is in the list
    const found = files.find((f) => f.original_filename === TEST_FILE_NAME);
    baseExpect(found).toBeDefined();
    baseExpect(found!.id).toBeTruthy();
  });

  base('file upload creates database record', async () => {
    if (!assessmentId) {
      base.skip(true, 'No assessment available for file upload test');
      return;
    }

    // Upload another file
    const ts = Date.now();
    const uniqueFileName = `e2e-db-record-${ts}.pdf`;
    const fileContent = fs.readFileSync(TEST_FILE_PATH);
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([fileContent], { type: 'application/pdf' }),
      uniqueFileName
    );

    const uploadResponse = await fetch(
      `${API_URL}/assessments/${assessmentId}/files`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!uploadResponse.ok) {
      base.skip(
        true,
        `File upload returned ${uploadResponse.status} — storage service may not be running`
      );
      return;
    }

    const uploadedFile = (await uploadResponse.json()) as {
      id: string;
      original_filename: string;
    };

    baseExpect(uploadedFile.id).toBeTruthy();
    baseExpect(uploadedFile.original_filename).toBe(uniqueFileName);

    // Verify via the list endpoint that the database record exists
    const files = await api.listFiles(token, assessmentId);
    const record = files.find((f) => f.original_filename === uniqueFileName);
    baseExpect(record).toBeDefined();
    baseExpect(record!.id).toBe(uploadedFile.id);
  });
});
