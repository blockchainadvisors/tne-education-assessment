# Journey 03 -- Assessment Lifecycle

## Actor

**tenant_admin** -- the primary user who creates, fills, and submits assessments for their institution.

## Preconditions

- The `tenant_admin` user is pre-seeded and logged in (use `tenantAdminPage` fixture from `auth.fixture.ts`).
- At least one active assessment template exists in the database (seeded by `scripts/seed_e2e_data.py`).
- The template contains all 5 themes (TL, SE, GV, IM, FN) with 52 items across 12 field types.

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Assessments list | UI | `/assessments` |
| New assessment form | UI | `/assessments/new` |
| List templates | API | `GET /api/v1/assessments/templates` |
| Create assessment | API | `POST /api/v1/assessments` |
| Assessment edit form | UI | `/assessments/{id}/edit` |
| Save responses | API | `PUT /api/v1/assessments/{id}/responses` |
| Submit assessment | API | `POST /api/v1/assessments/{id}/submit` |
| Review page | UI | `/assessments/{id}/review` |

---

## Step-by-Step Flow

### Step 1: Navigate to Assessments List

1. Start on `/dashboard` as the `tenantAdminPage`.
2. Click the "Assessments" link in the sidebar navigation.
3. Verify the URL is `/assessments`.
4. Verify the assessments list page loads, showing any existing assessments (or an empty state).

### Step 2: Create a New Assessment

1. Click the "New Assessment" / "Create Assessment" button.
2. The browser navigates to `/assessments/new`.
3. The page loads the list of available templates from `GET /api/v1/assessments/templates`.
4. Select the assessment template (e.g., "TNE Quality Assessment Framework").
5. Select or confirm the academic year (e.g., `"2025-2026"`).
6. Click "Create" / "Start Assessment".
7. The frontend calls `POST /api/v1/assessments` with `{ template_id, academic_year }`.
8. The API returns the newly created assessment with `status: "draft"`.
9. The browser redirects to `/assessments/{id}/edit`.

### Step 3: Assessment Edit Page Layout

1. Verify the edit page renders with:
   - **Sidebar navigation** listing all 5 themes: TL, SE, GV, IM, FN.
   - **Progress bar** showing completion percentage.
   - **Auto-save indicator** (initially shows "Saved" or no status).
   - **Theme title and description** for the currently active theme.
   - **Form fields** for the items in the active theme.
   - **"Submit for Review" button** (may be disabled until required fields are filled).

### Step 4: Fill All 12 Field Types

Using helpers from `helpers/field-helpers.ts`, fill items across the 5 themes. The 12 field types and how to interact with them:

| Field Type | Interaction | Helper |
|------------|-------------|--------|
| `short_text` | Fill a text input | `fillShortText(page, code, value)` |
| `long_text` | Fill a textarea | `fillLongText(page, code, value)` |
| `numeric` | Fill a number input | `fillNumeric(page, code, value)` |
| `percentage` | Fill a number input (0-100 range) | `fillPercentage(page, code, value)` |
| `yes_no_conditional` | Click Yes/No button, optionally fill details textarea | `selectYesNo(page, code, "Yes", details)` |
| `dropdown` | Select an option from a `<select>` | `selectDropdown(page, code, optionValue)` |
| `multi_select` | Click checkbox labels | `clickMultiSelect(page, code, labels)` |
| `file_upload` | Set files on hidden `<input type="file">` | `uploadFile(page, code, filePath)` |
| `multi_year_gender` | Fill grid of number inputs (year x gender) | `fillMultiYearGender(page, code, data)` |
| `partner_specific` | Select partner from dropdown, fill value | `selectPartnerSpecific(page, code, partnerName, value)` |
| `auto_calculated` | Read-only; verify displayed value | `assertAutoCalculated(page, code)` |
| `salary_bands` | Fill min/max/median number inputs per band | `fillSalaryBands(page, code, bands)` |

For bulk-filling, use `fillFieldByType(page, code, type)` which applies sensible defaults per type.

### Step 5: Auto-Save Behavior

1. After filling a field, wait for the auto-save indicator to transition:
   - Idle -> "Saving..." -> "Saved"
2. Auto-save triggers after **2 seconds of inactivity** (debounced).
3. Use `waitForAutoSave(page)` from `helpers/wait-helpers.ts` to wait for the "Saved" indicator.
4. Verify that responses are persisted by checking `GET /api/v1/assessments/{id}/responses` via `ApiSeeder`.

### Step 6: Theme Navigation via Sidebar

1. Click the "SE" (Student Experience) theme in the sidebar.
2. Verify the form updates to show SE-themed items.
3. Verify the progress bar updates to reflect completed items.
4. Click back to "TL" (Teaching & Learning).
5. Verify previously filled responses are still visible and persisted.
6. Navigate through all 5 themes: TL -> SE -> GV -> IM -> FN.

### Step 7: Progress Bar

1. As fields are filled, the progress bar should update its width percentage.
2. Verify the progress bar reflects the ratio of completed fields to total fields.
3. When all required fields are filled, the progress bar should show 100% (or close to it).

### Step 8: Submit Assessment

1. After filling sufficient fields, click the "Submit for Review" button.
2. A **confirmation dialog** appears asking the user to confirm submission.
3. Click "Confirm" / "Yes, Submit".
4. The frontend calls `POST /api/v1/assessments/{id}/submit`.
5. The API changes the assessment status from `draft` to `submitted` and returns the updated assessment.
6. Verify the status badge changes to "Submitted".

### Step 9: Review Page (Read-Only)

1. Navigate to `/assessments/{id}/review` (or be redirected after submission).
2. Verify the review page renders all responses in **read-only** mode.
3. Verify that form fields are disabled or displayed as static text.
4. Verify that all previously saved responses are correctly displayed.
5. Verify the status shows "Submitted".

---

## Assertions

### Creation

| # | Assertion |
|---|-----------|
| A1 | Template list loads from API |
| A2 | Creating an assessment redirects to `/assessments/{id}/edit` |
| A3 | New assessment has `status: "draft"` |

### Form Interaction

| # | Assertion |
|---|-----------|
| A4 | All 12 field types render correctly in the form |
| A5 | Fields accept input and display entered values |
| A6 | Auto-save triggers within ~3 seconds of the last input |
| A7 | Auto-save indicator shows "Saved" after save completes |
| A8 | Responses are persisted (verified via API or page reload) |

### Navigation

| # | Assertion |
|---|-----------|
| A9 | Sidebar theme links navigate between theme sections |
| A10 | Previously entered responses are retained after theme navigation |
| A11 | Progress bar updates as fields are filled |

### Submission

| # | Assertion |
|---|-----------|
| A12 | Confirmation dialog appears before submission |
| A13 | After submission, assessment status changes to "submitted" |
| A14 | Review page displays responses in read-only mode |

---

## Related Test Spec

```
e2e/tests/03-assessment-lifecycle.spec.ts
```

## Fixtures Used

- `tenantAdminPage` from `fixtures/auth.fixture.ts` -- pre-authenticated page.
- `ApiSeeder` from `fixtures/api-seeder.ts` -- for verifying responses via API.
- Field helpers from `helpers/field-helpers.ts` -- for filling each field type.
- `waitForAutoSave()` from `helpers/wait-helpers.ts` -- for confirming auto-save completion.
- `SAMPLE_RESPONSES` from `fixtures/test-data.ts` -- sample item code to response mappings.
- `ACADEMIC_YEAR` from `fixtures/test-data.ts` -- `"2025-2026"`.

## Notes

- The edit page uses UUIDs for field IDs (`#field-{uuid}`), so field helpers locate fields by their visible item code text (e.g., "TL01") rather than by ID.
- Auto-save uses a 2-second debounce: the `PUT /api/v1/assessments/{id}/responses` call fires 2 seconds after the user stops typing.
- The `auto_calculated` and `partner_specific` field types have special behaviors: auto_calculated is read-only, and partner_specific requires a partner to be selected first.
- Only assessments in `draft` status can be submitted. Attempting to submit an already-submitted assessment will fail.
