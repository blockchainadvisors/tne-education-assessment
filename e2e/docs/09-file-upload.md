# Journey 09 -- File Upload

## Actor

**tenant_admin** or **assessor** -- any user with permission to edit a draft assessment.

## Preconditions

- The user is pre-seeded and logged in (use `tenantAdminPage` or `assessorPage` fixture).
- A draft assessment exists for the user's tenant.
- MinIO (S3-compatible storage) is running and accessible.
- A test file exists on disk for upload (created during test setup or stored in the `e2e/fixtures/` directory).

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Assessment edit | UI | `/assessments/{id}/edit` |
| Save responses | API | `PUT /api/v1/assessments/{id}/responses` |
| List files | API | `GET /api/v1/assessments/{id}/files` |

---

## Step-by-Step Flow

### Step 1: Navigate to Assessment Edit Page

1. Navigate to `/assessments/{id}/edit` using a pre-authenticated page.
2. Navigate to the theme that contains a `file_upload` field type (check the template structure).
3. Locate the file upload field by its item code (e.g., using `locateFieldByCode(page, itemCode)`).

### Step 2: Upload a File via Hidden Input

1. The `file_upload` field renders a styled upload area with a hidden `<input type="file">`.
2. Use Playwright's `setInputFiles()` to programmatically set the file:
   ```typescript
   const container = locateFieldByCode(page, "GV03"); // Example item code
   const fileInput = container.locator("input[type='file']");
   await fileInput.setInputFiles("/path/to/test-document.pdf");
   ```
   Or use the helper:
   ```typescript
   await uploadFile(page, "GV03", "/path/to/test-document.pdf");
   ```
3. The file is uploaded to the backend, which stores it in MinIO.

### Step 3: Verify File Appears in UI

1. After the upload completes, verify the uploaded file's name is displayed in the field area.
2. The UI should show:
   - The original filename (e.g., "test-document.pdf").
   - A file size indicator.
   - A remove/delete button (optional).
3. Verify no error messages are displayed.

### Step 4: Wait for Auto-Save

1. The file upload may trigger an auto-save of the response referencing the uploaded file.
2. Use `waitForAutoSave(page)` to confirm the save completed.

### Step 5: Verify File via API

1. Using `ApiSeeder`, retrieve the list of files for the assessment:
   ```typescript
   const files = await api.listFiles(token, assessmentId);
   ```
2. This calls `GET /api/v1/assessments/{id}/files`.
3. Verify the response includes an entry with:
   - `original_filename`: matching the uploaded file name.
   - `id`: a valid UUID.

### Step 6: Verify Persistence After Reload

1. Reload the page or navigate away and back to the edit page.
2. Verify the file upload field still shows the uploaded file name.
3. Verify the file has not been lost.

---

## Assertions

### Upload

| # | Assertion |
|---|-----------|
| A1 | File input accepts the file via `setInputFiles()` |
| A2 | Uploaded filename is displayed in the field area |
| A3 | No error messages appear after upload |

### Persistence

| # | Assertion |
|---|-----------|
| A4 | Auto-save indicator shows "Saved" after upload |
| A5 | `GET /assessments/{id}/files` returns the uploaded file |
| A6 | File persists after page reload |

### File Metadata

| # | Assertion |
|---|-----------|
| A7 | API response includes `original_filename` matching the uploaded file |
| A8 | API response includes a valid `id` for the file |

---

## Test Setup

### Creating the Test File

Before running the test, create a small test file for upload:

```typescript
import * as fs from "fs";
import * as path from "path";

const testFilePath = path.join(__dirname, "..", "fixtures", "test-upload.pdf");

// Create a minimal test file if it doesn't exist
if (!fs.existsSync(testFilePath)) {
  fs.writeFileSync(testFilePath, "Minimal test file content for E2E upload testing.");
}
```

Alternatively, place a small PDF or text file in `e2e/fixtures/test-upload.pdf` before running.

### Creating the Draft Assessment

```typescript
const token = await api.getToken("tenantAdmin");
const templates = await api.getTemplates(token);
const assessment = await api.createAssessment(token, templates[0].id, "2025-2026");
const assessmentId = assessment.id;
```

---

## Related Test Spec

```
e2e/tests/09-file-upload.spec.ts
```

## Fixtures Used

- `tenantAdminPage` or `assessorPage` from `fixtures/auth.fixture.ts` -- pre-authenticated page.
- `ApiSeeder` from `fixtures/api-seeder.ts` -- for verifying uploaded files via API.
- `uploadFile()` from `helpers/field-helpers.ts` -- for interacting with file upload fields.
- `waitForAutoSave()` from `helpers/wait-helpers.ts` -- for confirming save after upload.

## Notes

- File uploads are stored in MinIO (S3-compatible object storage). The backend returns file metadata (id, filename, size) but not the raw file content via the list endpoint.
- The `<input type="file">` element is hidden and styled with a custom upload area. Playwright's `setInputFiles()` works on hidden inputs.
- Maximum file size and allowed file types may be enforced by the backend. Verify that the test file meets any constraints.
- If MinIO is not running, the upload will fail with a server error. The global setup script checks service availability but does not specifically verify MinIO.
