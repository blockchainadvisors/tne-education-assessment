# Journey 05 -- Reviewer Journey

## Actor

**reviewer** -- a user with the `reviewer` role who evaluates submitted assessments, triggers AI scoring, and generates reports.

## Preconditions

- The `reviewer` user is pre-seeded and logged in (use `reviewerPage` fixture from `auth.fixture.ts`).
- A `submitted` assessment exists for the reviewer's tenant (created and submitted via `ApiSeeder` in test setup).
- Celery worker is running (for async scoring and report generation).
- Credentials: `e2e-reviewer@demo-university.ac.uk` / `TestPass123!` (from `USERS.reviewer`).

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Assessments list | UI | `/assessments` |
| Assessment review | UI | `/assessments/{id}/review` |
| Change status | API | `POST /api/v1/assessments/{id}/status/under_review` |
| Trigger scoring | API | `POST /api/v1/assessments/{id}/scores/trigger-scoring` |
| Poll job status | API | `GET /api/v1/jobs/{job_id}` |
| Get scores | API | `GET /api/v1/assessments/{id}/scores` |
| Trigger report | API | `POST /api/v1/assessments/{id}/report/generate` |
| Get report | API | `GET /api/v1/assessments/{id}/report` |

---

## Step-by-Step Flow

### Step 1: View Submitted Assessment

1. Navigate to `/assessments` using the `reviewerPage`.
2. Locate the assessment with status "Submitted".
3. Click on the assessment to open the review page at `/assessments/{id}/review`.
4. Verify the review page renders all responses in read-only mode:
   - All filled fields display their saved values.
   - Fields are not editable (inputs are disabled or displayed as text).
   - The status badge shows "Submitted".

### Step 2: Change Status to Under Review (API)

1. Using `ApiSeeder`, call:
   ```typescript
   await api.changeAssessmentStatus(reviewerToken, assessmentId, "under_review");
   ```
2. This calls `POST /api/v1/assessments/{id}/status/under_review`.
3. The API updates the assessment status and returns the updated assessment.
4. Verify the returned object has `status: "under_review"`.

> **Note**: This step is performed via API because the Phase 1 UI may not have inline status-change controls on the review page. A page reload or re-navigation should reflect the new status.

### Step 3: Trigger AI Scoring (API)

1. Using `ApiSeeder`, call:
   ```typescript
   const scoringJob = await api.triggerScoring(reviewerToken, assessmentId);
   ```
2. This calls `POST /api/v1/assessments/{id}/scores/trigger-scoring`.
3. The API returns HTTP **202 Accepted** with an `AIJob` object:
   ```json
   { "id": "<job_id>", "status": "queued", "job_type": "scoring" }
   ```
4. Note the `job_id` for polling.

### Step 4: Poll Scoring Job

1. Use `waitForJob(token, jobId)` from `helpers/wait-helpers.ts`.
2. This polls `GET /api/v1/jobs/{job_id}` every 2 seconds (up to 60 seconds).
3. The job transitions through: `queued` -> `processing` -> `completed` (or `failed`).
4. Verify the final job status is `completed`.
5. If the job fails, `error_message` will contain details.

### Step 5: View Scores

1. After scoring completes, retrieve scores via API:
   ```typescript
   const scores = await api.getScores(reviewerToken, assessmentId);
   ```
2. This calls `GET /api/v1/assessments/{id}/scores`.
3. The response contains:
   ```json
   {
     "assessment_id": "<id>",
     "overall_score": 78.5,
     "theme_scores": [
       { "theme_code": "TL", "theme_name": "Teaching & Learning", "score": 82.0 },
       { "theme_code": "SE", "theme_name": "Student Experience", "score": 75.0 },
       ...
     ]
   }
   ```
4. Verify `overall_score` is a number (not null).
5. Verify `theme_scores` contains entries for all 5 themes (TL, SE, GV, IM, FN).

### Step 6: Verify Assessment Status Updated to "scored"

1. Retrieve the assessment:
   ```typescript
   const assessment = await api.getAssessment(reviewerToken, assessmentId);
   ```
2. Verify `assessment.status === "scored"`.
3. Verify `assessment.overall_score` matches the scores response.

### Step 7: Trigger Report Generation (API)

1. Using `ApiSeeder`, call:
   ```typescript
   const reportJob = await api.triggerReport(reviewerToken, assessmentId);
   ```
2. This calls `POST /api/v1/assessments/{id}/report/generate`.
3. The API returns HTTP **202 Accepted** with an `AIJob` object:
   ```json
   { "id": "<job_id>", "status": "queued", "job_type": "report_generation" }
   ```
4. Report generation requires the assessment to be in `scored` or `report_generated` status.

### Step 8: Poll Report Job

1. Use `waitForJob(token, jobId)` again to poll the report generation job.
2. Verify the final job status is `completed`.

### Step 9: View Report

1. Retrieve the report via API:
   ```typescript
   const report = await api.getReport(reviewerToken, assessmentId);
   ```
2. This calls `GET /api/v1/assessments/{id}/report`.
3. Verify the report contains narrative content (not null/empty).
4. Verify the assessment status is now `report_generated`.

### Step 10: View Report in UI (Optional)

1. Navigate to the assessment review page at `/assessments/{id}/review`.
2. If the UI has a "View Report" tab or section, verify it displays report content.
3. Verify the status badge shows "Report Generated".

---

## Assertions

### Review Page

| # | Assertion |
|---|-----------|
| A1 | Review page displays all saved responses in read-only mode |
| A2 | Status badge initially shows "Submitted" |

### Status Transition

| # | Assertion |
|---|-----------|
| A3 | Status changes from "submitted" to "under_review" via API |
| A4 | Only allowed roles (reviewer, tenant_admin, platform_admin) can change status |

### Scoring

| # | Assertion |
|---|-----------|
| A5 | Trigger scoring returns HTTP 202 with a queued job |
| A6 | Scoring job completes within 60 seconds |
| A7 | `overall_score` is a number between 0 and 100 |
| A8 | All 5 themes have scores |
| A9 | Assessment status is "scored" after scoring completes |

### Report

| # | Assertion |
|---|-----------|
| A10 | Trigger report returns HTTP 202 with a queued job |
| A11 | Report job completes within 60 seconds |
| A12 | Report content is non-empty |
| A13 | Assessment status is "report_generated" after report completes |

### Error Cases

| # | Assertion | Trigger | Expected |
|---|-----------|---------|----------|
| E1 | Cannot score a draft assessment | Trigger scoring on draft | HTTP 400: "Cannot score assessment with status 'draft'" |
| E2 | Cannot generate report on unscored assessment | Trigger report on submitted | HTTP 400: "Assessment must be scored before generating a report" |

---

## Related Test Spec

```
e2e/tests/05-reviewer.spec.ts
```

## Fixtures Used

- `reviewerPage` from `fixtures/auth.fixture.ts` -- pre-authenticated page as reviewer.
- `ApiSeeder` from `fixtures/api-seeder.ts` -- for status transitions, scoring, report operations.
- `waitForJob()` from `helpers/wait-helpers.ts` -- for polling async jobs.
- `USERS.reviewer` from `fixtures/test-data.ts` -- credentials for API calls.

## Test Setup

Before the test begins, the test setup should:

1. Log in as `tenantAdmin` via `ApiSeeder.getToken("tenantAdmin")`.
2. Create a new assessment in `draft` status.
3. Fill responses using `api.saveResponses(token, assessmentId, responses)`.
4. Submit the assessment using `api.submitAssessment(token, assessmentId)`.
5. Note the `assessmentId` for use throughout the test.

The reviewer can then view and process this submitted assessment.

## Notes

- AI scoring and report generation are async operations dispatched via Celery. The jobs run in background workers and may take 10-30 seconds depending on the AI model latency.
- The `waitForJob()` helper polls every 2 seconds with a 60-second timeout, which should be sufficient for most environments.
- Scoring requires the assessment to be in `submitted` or `under_review` status. Report generation requires `scored` or `report_generated` status.
- If AI services (Claude API) are not configured, scoring and report jobs will fail. Tests should handle this gracefully.
