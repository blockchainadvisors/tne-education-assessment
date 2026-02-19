# TNE Assessment Platform -- End-to-End Tests

## Overview

This directory contains the Playwright-based end-to-end test suite for the TNE Quality Assessment & Benchmarking Platform. The tests verify complete user journeys across all platform roles, from registration through assessment creation, scoring, and report generation.

---

## Prerequisites

### Services (Docker Compose)

All platform services must be running. Start them from the `infrastructure/` directory:

```bash
cd infrastructure
docker compose up -d
```

Required services:

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:8000 | FastAPI application server |
| Frontend | http://localhost:3000 | Next.js application |
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Celery broker and cache |
| Celery Worker | (background) | Async AI scoring and report jobs |
| MinIO | http://localhost:9000 | S3-compatible file storage |
| Mailpit | http://localhost:8025 | SMTP capture for email testing |

### Node.js

- Node.js 20+ is required.
- Install dependencies:

```bash
cd e2e
npm install
```

### Playwright Browsers

Install the Chromium browser binary (first time only):

```bash
npx playwright install chromium
```

---

## Seed Data

Before running tests, seed the database with test users, tenants, templates, and sample data:

```bash
cd backend
python -m scripts.seed_e2e_data
```

This creates:

| User | Email | Role | Tenant |
|------|-------|------|--------|
| E2E Admin User | e2e-admin@demo-university.ac.uk | tenant_admin | E2E Test University |
| E2E Assessor User | e2e-assessor@demo-university.ac.uk | assessor | E2E Test University |
| E2E Reviewer User | e2e-reviewer@demo-university.ac.uk | reviewer | E2E Test University |
| E2E Platform Admin | e2e-platform@tne-academy.com | platform_admin | (cross-tenant) |

All test users have `email_verified = True` and are ready to use.

To reset seed data and start fresh:

```bash
python -m scripts.seed_e2e_data --reset
```

---

## Run Commands

### Run All Tests

```bash
cd e2e
npm test
```

### Run a Specific Test File

```bash
npx playwright test tests/01-registration.spec.ts
```

### Run Tests Matching a Pattern

```bash
npx playwright test -g "login"
```

### Headed Mode (Watch the Browser)

```bash
npm run test:headed
```

### Debug Mode (Step-Through with Inspector)

```bash
npm run test:debug
```

### Interactive UI Mode

```bash
npm run test:ui
```

### View the Last HTML Report

```bash
npm run report
```

---

## Configuration

Test configuration is in `playwright.config.ts`:

| Setting | Value | Notes |
|---------|-------|-------|
| `testDir` | `./tests` | Test spec files directory |
| `fullyParallel` | `false` | Tests run sequentially |
| `workers` | `1` | Single worker to avoid race conditions |
| `timeout` | 60,000 ms | Per-test timeout |
| `expect.timeout` | 10,000 ms | Assertion timeout |
| `actionTimeout` | 15,000 ms | Per-action timeout |
| `navigationTimeout` | 30,000 ms | Page navigation timeout |
| `retries` | 0 | No automatic retries |
| Browser | Chromium (Desktop Chrome) | Single browser project |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | Frontend URL |
| `API_URL` | `http://localhost:8000/api/v1` | Backend API URL |
| `MAILPIT_URL` | `http://localhost:8025` | Mailpit URL |

Override by setting environment variables before running:

```bash
BASE_URL=https://staging.example.com npx playwright test
```

---

## Directory Structure

```
e2e/
  docs/                         Journey documentation
    00-overview.md              Overview and index
    01-registration-onboarding.md
    02-authentication.md
    03-assessment-lifecycle.md
    04-assessor-journey.md
    05-reviewer-journey.md
    06-platform-admin.md
    07-tenant-management.md
    08-user-management.md
    09-file-upload.md
    10-benchmarking.md
    11-error-edge-cases.md

  fixtures/                     Test data and setup utilities
    test-data.ts                Credentials, sample responses, constants
    api-seeder.ts               Direct HTTP client for API setup/teardown
    mailpit.ts                  Mailpit API helper for email token extraction
    auth.fixture.ts             Pre-authenticated Page fixtures per role

  helpers/                      Reusable interaction helpers
    field-helpers.ts            Locate and interact with all 12 field types
    wait-helpers.ts             Poll async jobs, wait for auto-save

  pages/                        Page Object Models (optional)

  tests/                        Playwright test specs (*.spec.ts)

  playwright.config.ts          Playwright configuration
  global-setup.ts               Pre-test service checks and seed verification
  global-teardown.ts            Post-test cleanup
  package.json                  npm scripts and dependencies
  tsconfig.json                 TypeScript configuration
  README.md                     This file
```

---

## Global Setup and Teardown

### Global Setup (`global-setup.ts`)

Runs once before all tests:

1. **Service health checks** -- verifies that the Backend API, Frontend, and Mailpit are reachable.
2. **Seed data verification** -- attempts to log in as each pre-seeded user to confirm they exist.
3. **Mailpit inbox clear** -- deletes all messages for a clean test run.

If any service is unreachable, setup fails with a descriptive error.

### Global Teardown (`global-teardown.ts`)

Runs once after all tests:

- Logs a completion message.
- Seed data is intentionally left intact for re-runs.

---

## Authentication Fixtures

The `auth.fixture.ts` file provides pre-authenticated `Page` objects for each role:

```typescript
import { test, expect } from "../fixtures/auth.fixture";

test("tenant admin can view dashboard", async ({ tenantAdminPage }) => {
  await tenantAdminPage.goto("/dashboard");
  await expect(tenantAdminPage).toHaveURL(/dashboard/);
});
```

Available fixtures:
- `tenantAdminPage` -- logged in as `USERS.tenantAdmin`
- `assessorPage` -- logged in as `USERS.assessor`
- `reviewerPage` -- logged in as `USERS.reviewer`
- `platformAdminPage` -- logged in as `USERS.platformAdmin`

Authentication is done via API login + `localStorage` injection (tokens are stored in `localStorage`, not cookies).

---

## Field Helpers

The `field-helpers.ts` file provides functions to interact with all 12 field types:

```typescript
import { fillShortText, fillNumeric, selectYesNo } from "../helpers/field-helpers";

await fillShortText(page, "TL01", "My response text");
await fillNumeric(page, "TL03", 85);
await selectYesNo(page, "TL05", "Yes", "Additional details here");
```

Fields are located by their item code (e.g., "TL01") rather than by UUID-based IDs.

---

## Debugging Tips

### View Traces on Failure

Traces are automatically saved on test failure. Open them with:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

### Screenshots on Failure

Screenshots are captured on failure and stored in `test-results/`.

### Video on Failure

Videos of failed tests are retained in `test-results/`.

### Run a Single Test in Debug Mode

```bash
npx playwright test tests/02-authentication.spec.ts --debug
```

This opens the Playwright Inspector, allowing you to step through each action.

### Check API Directly

Use the `ApiSeeder` class to make API calls from a standalone script or Node.js REPL:

```typescript
import { ApiSeeder } from "./fixtures/api-seeder";
const api = new ApiSeeder();
const tokens = await api.login("e2e-admin@demo-university.ac.uk", "TestPass123!");
console.log(tokens);
```

### Check Mailpit

Open http://localhost:8025 in a browser to view captured emails during test development.

### Common Issues

| Issue | Solution |
|-------|----------|
| "Service not reachable" in global setup | Ensure all Docker Compose services are running |
| "Login failed" for seeded users | Run `python -m scripts.seed_e2e_data` to re-seed |
| Timeout waiting for email | Check that the Celery worker is running and Mailpit is accessible |
| File upload fails | Verify MinIO is running at port 9000 |
| Scoring job fails | Check that the Claude API key is configured in the backend `.env` |
| Tests interfere with each other | Tests run sequentially; check seed data state |
