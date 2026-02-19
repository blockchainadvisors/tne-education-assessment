# Journey 04 -- Assessor Journey

## Actor

**assessor** -- a user with the `assessor` role who fills in assessment responses for their institution. The assessor can view and edit draft assessments but cannot create new assessments or change assessment status.

## Preconditions

- The `assessor` user is pre-seeded and logged in (use `assessorPage` fixture from `auth.fixture.ts`).
- At least one assessment in `draft` status exists for the assessor's tenant, created by the `tenant_admin` via `ApiSeeder` in test setup.
- Credentials: `e2e-assessor@demo-university.ac.uk` / `TestPass123!` (from `USERS.assessor` in `test-data.ts`).

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Dashboard | UI | `/dashboard` |
| Assessments list | UI | `/assessments` |
| Assessment edit | UI | `/assessments/{id}/edit` |
| Save responses | API | `PUT /api/v1/assessments/{id}/responses` |
| Get responses | API | `GET /api/v1/assessments/{id}/responses` |

---

## Step-by-Step Flow

### Step 1: Dashboard Overview

1. Navigate to `/dashboard` using the pre-authenticated `assessorPage`.
2. Verify the dashboard loads and displays:
   - Status cards showing assessment counts (e.g., "Drafts: 1", "Submitted: 0").
   - The user's name or role indication.
3. The dashboard provides an overview of the assessor's tenant's assessment status.

### Step 2: Navigate to Assessments List

1. Click "Assessments" in the sidebar navigation (or a dashboard card link).
2. Verify the URL is `/assessments`.
3. Verify the assessments list displays at least one assessment.
4. Each assessment row should show:
   - Academic year (e.g., "2025-2026")
   - Status badge (e.g., "Draft")
   - Action links (e.g., "Edit", "View")

### Step 3: Open Draft Assessment for Editing

1. Locate the draft assessment in the list.
2. Click the "Edit" link or the assessment row.
3. Verify the URL changes to `/assessments/{id}/edit`.
4. Verify the assessment edit form loads with:
   - Sidebar navigation with theme tabs (TL, SE, GV, IM, FN).
   - Form fields for the active theme's items.
   - Auto-save indicator.

### Step 4: Fill Fields

1. Fill several fields across different types using field helpers:
   ```
   fillShortText(page, "TL01", "Comprehensive QA framework for TNE delivery")
   fillLongText(page, "TL02", "Annual review cycle with external examiner input")
   fillNumeric(page, "TL03", 85)
   fillPercentage(page, "TL04", 92)
   selectYesNo(page, "TL05", "Yes", "Regular staff development programmes in place")
   ```
2. After each fill, observe the auto-save indicator.

### Step 5: Auto-Save Confirmation

1. After filling a field, wait 2+ seconds for the debounce timer.
2. The auto-save indicator transitions: idle -> "Saving..." -> "Saved".
3. Use `waitForAutoSave(page)` to confirm the save completed.
4. Verify via API: call `api.getResponses(token, assessmentId)` and confirm the responses are persisted with the correct values.

### Step 6: Manual Save (if available)

1. If the UI provides a manual "Save" button, click it.
2. Use `waitForManualSave(page)` from `helpers/wait-helpers.ts` to wait for the save to complete.
3. Verify the indicator shows "Saved".

### Step 7: Navigate Away and Back

1. After filling and saving responses, navigate away from the edit page:
   - Click "Assessments" in the sidebar to go back to `/assessments`.
2. Then navigate back to the same assessment's edit page:
   - Click the assessment row or "Edit" link.
3. Verify the URL is `/assessments/{id}/edit`.
4. Verify all previously saved responses are displayed in the form fields.
5. Specifically check:
   - Short text fields show the entered text.
   - Numeric fields show the entered numbers.
   - Yes/No fields show the selected state.
   - Long text fields show the full entered text.

### Step 8: Cross-Theme Persistence

1. Navigate to the "SE" (Student Experience) theme via the sidebar.
2. Fill a field in the SE theme:
   ```
   fillShortText(page, "SE01", "Dedicated student support services at partner locations")
   ```
3. Wait for auto-save.
4. Navigate back to the "TL" theme.
5. Verify TL responses are still displayed.
6. Navigate back to "SE" and verify the SE response is still displayed.

---

## Assertions

### Dashboard

| # | Assertion |
|---|-----------|
| A1 | Dashboard loads and displays status cards |
| A2 | Status cards reflect the correct assessment counts for the tenant |

### Assessments List

| # | Assertion |
|---|-----------|
| A3 | Assessments list shows at least one draft assessment |
| A4 | Each assessment displays academic year and status |

### Form Editing

| # | Assertion |
|---|-----------|
| A5 | Edit page renders fields for the active theme |
| A6 | Fields accept input correctly for each field type |
| A7 | Auto-save triggers within ~3 seconds of last input |
| A8 | Auto-save indicator shows "Saved" |

### Persistence

| # | Assertion |
|---|-----------|
| A9 | After navigating away and back, all responses are present in the form |
| A10 | API `GET /assessments/{id}/responses` returns the saved responses with correct values |
| A11 | Responses persist across theme navigation within the edit page |

---

## Related Test Spec

```
e2e/tests/04-assessor.spec.ts
```

## Fixtures Used

- `assessorPage` from `fixtures/auth.fixture.ts` -- pre-authenticated page as assessor.
- `ApiSeeder` from `fixtures/api-seeder.ts` -- to create a draft assessment in test setup and to verify responses via API.
- Field helpers from `helpers/field-helpers.ts` -- for filling each field type.
- `waitForAutoSave()` from `helpers/wait-helpers.ts` -- for confirming auto-save completion.
- `USERS.assessor` from `fixtures/test-data.ts` -- credentials for API calls in setup.

## Test Setup

Before the test begins, the test setup should:

1. Log in as `tenantAdmin` via `ApiSeeder.getToken("tenantAdmin")`.
2. Create a new assessment in `draft` status using `api.createAssessment(token, templateId, "2025-2026")`.
3. Note the `assessmentId` for use throughout the test.

The assessor can then edit this assessment since they belong to the same tenant.

## Notes

- The assessor role can only edit assessments in `draft` status. Submitted or reviewed assessments are read-only for assessors.
- The assessor cannot submit assessments -- that action requires the `tenant_admin` role. However, the assessor can fill in and save responses.
- Auto-save uses a 2-second debounce. Tests should wait at least 3 seconds after the last input before checking persistence.
