# Journey 10 -- Benchmarking

## Actor

**tenant_admin** -- views benchmarking data for their institution's assessments compared against anonymised peer institutions.

## Preconditions

- The `tenant_admin` user is pre-seeded and logged in (use `tenantAdminPage` fixture).
- At least one scored assessment exists for the tenant (for API testing).
- Credentials: `e2e-admin@demo-university.ac.uk` / `TestPass123!`.

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Benchmarks page | UI | `/benchmarks` |
| Compare assessment | API | `GET /api/v1/benchmarks/compare/{assessment_id}` |

---

## Step-by-Step Flow

### Step 1: Navigate to Benchmarks Page (UI)

1. Navigate to `/benchmarks` using the `tenantAdminPage`.
2. Verify the page loads without errors.
3. In Phase 1, the benchmarks page shows an **"Insufficient Peer Data"** message or similar placeholder.
4. This is expected because meaningful benchmarking requires multiple institutions to have completed assessments, which is not the case in an E2E test environment.

### Step 2: Verify Placeholder Content

1. Verify the page displays text indicating insufficient data for benchmarking.
2. Possible messages include:
   - "Insufficient Peer Data"
   - "Not enough peer data available for comparison"
   - "Coming Soon" or similar Phase 1 placeholder
3. Verify no JavaScript errors in the console.

### Step 3: Benchmark Comparison via API

1. First, ensure a scored assessment exists. If not, create and score one in test setup (see Test Setup below).
2. Using `ApiSeeder`, call:
   ```typescript
   const comparison = await api.getBenchmarkComparison(tenantAdminToken, assessmentId);
   ```
3. This calls `GET /api/v1/benchmarks/compare/{assessment_id}`.
4. The response conforms to `BenchmarkCompareResponse`:
   ```json
   {
     "academic_year": "2025-2026",
     "country": null,
     "metrics": [
       {
         "metric_name": "Teaching & Learning",
         "percentile_10": 45.0,
         "percentile_25": 55.0,
         "percentile_50": 65.0,
         "percentile_75": 75.0,
         "percentile_90": 85.0,
         "sample_size": 1,
         "institution_value": 82.0
       }
     ]
   }
   ```
5. Verify the response structure contains `academic_year`, `country`, and `metrics` fields.

### Step 4: Benchmark Comparison with Country Filter

1. Call the benchmark endpoint with a country filter:
   ```typescript
   const result = await api.rawRequest("GET", `/benchmarks/compare/${assessmentId}?country=United%20Kingdom`, {
     token: tenantAdminToken,
   });
   ```
2. Verify the response includes the `country` field set to the queried value.
3. The metrics may differ (or be empty) when filtered by country.

### Step 5: Benchmark for Non-Scored Assessment

1. Attempt to get benchmark comparison for an assessment that is not yet scored (e.g., a draft):
   ```typescript
   const result = await api.rawRequest("GET", `/benchmarks/compare/${draftAssessmentId}`, {
     token: tenantAdminToken,
   });
   ```
2. Verify the behavior -- the response may return empty metrics or an error, depending on the backend implementation.

---

## Assertions

### UI

| # | Assertion |
|---|-----------|
| A1 | Benchmarks page at `/benchmarks` loads without errors |
| A2 | Page displays "Insufficient Peer Data" or Phase 1 placeholder content |
| A3 | No JavaScript console errors |

### API

| # | Assertion |
|---|-----------|
| A4 | `GET /benchmarks/compare/{id}` returns a valid response with `academic_year` and `metrics` |
| A5 | Response `metrics` is an array (may be empty or populated depending on data) |
| A6 | Each metric has `metric_name`, percentile fields, `sample_size`, and `institution_value` |
| A7 | Country-filtered request includes the `country` field in the response |

### Authorization

| # | Assertion |
|---|-----------|
| A8 | Benchmark comparison is scoped to the current tenant's assessments |
| A9 | Attempting to compare a cross-tenant assessment returns 404 |

---

## Test Setup

To test the API endpoint with a scored assessment:

1. Log in as `tenantAdmin` via `ApiSeeder`.
2. Create a draft assessment.
3. Save sample responses using `api.saveResponses()`.
4. Submit the assessment using `api.submitAssessment()`.
5. Change status to `under_review` using `api.changeAssessmentStatus()`.
6. Trigger scoring using `api.triggerScoring()`.
7. Wait for the scoring job to complete using `waitForJob()`.
8. Use the scored `assessmentId` for benchmark comparison.

---

## Related Test Spec

```
e2e/tests/10-benchmarking.spec.ts
```

## Fixtures Used

- `tenantAdminPage` from `fixtures/auth.fixture.ts` -- pre-authenticated page.
- `ApiSeeder` from `fixtures/api-seeder.ts` -- for API-level benchmark queries.
- `waitForJob()` from `helpers/wait-helpers.ts` -- for scoring job polling in setup.
- `USERS.tenantAdmin` from `fixtures/test-data.ts` -- credentials.

## Notes

- Benchmarking in Phase 1 is limited because meaningful peer comparison requires multiple institutions with scored assessments. The E2E environment typically has only 1-2 tenants, so benchmark data will be sparse.
- The benchmarks page UI shows a placeholder message in Phase 1. This is by design.
- The API endpoint works and returns data, but the `sample_size` will be small (often 1), and percentile values may all be the same since there is no meaningful distribution.
- The `country` query parameter is optional. When omitted, the comparison is global (all tenants). When provided, it filters to tenants in the specified country.
