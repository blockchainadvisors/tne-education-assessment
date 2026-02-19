# TNE Assessment Platform -- E2E Test Suite Overview

## Purpose

This directory contains journey-based documentation for the end-to-end (E2E) test suite of the TNE Quality Assessment & Benchmarking Platform. Each document describes a complete user journey through the application, mapping actor, preconditions, step-by-step flows, API endpoints, UI routes, assertions, and the corresponding test spec file.

The documentation serves two goals:

1. **Test specification** -- define exactly what each Playwright spec must verify.
2. **Living reference** -- give developers a single place to understand how each role interacts with the platform.

---

## Platform Roles

| Role | Description | Scope |
|------|-------------|-------|
| `platform_admin` | Superuser across all tenants. Views global stats, manages tenants. | Cross-tenant |
| `tenant_admin` | Administrator for a single tenant/institution. Creates assessments, manages users and partners, triggers scoring and reports. | Single tenant |
| `assessor` | Fills in assessment responses. Can view and edit draft assessments assigned to their tenant. | Single tenant |
| `reviewer` | Reviews submitted assessments. Can change status, trigger AI scoring, and generate reports. | Single tenant |
| `institution_user` | Read-only user who can view reports and benchmarks for their institution. | Single tenant |

---

## Assessment Lifecycle

```
draft --> submitted --> under_review --> scored --> report_generated
```

- **draft** -- assessment is being filled in. Responses auto-save after 2 seconds of inactivity.
- **submitted** -- the tenant_admin or assessor has submitted the assessment for review.
- **under_review** -- a reviewer has accepted the submission and is evaluating it.
- **scored** -- AI scoring (via Celery + Claude API) has completed. Theme and overall scores are available.
- **report_generated** -- AI report generation has completed. A full narrative report is available.

---

## Data Model Highlights

- **5 themes**: Teaching & Learning (TL), Student Experience (SE), Governance (GV), Institutional Management (IM), Financial (FN)
- **52 assessment items** spread across the 5 themes
- **12 field types**: `short_text`, `long_text`, `numeric`, `percentage`, `yes_no_conditional`, `dropdown`, `multi_select`, `file_upload`, `multi_year_gender`, `partner_specific`, `auto_calculated`, `salary_bands`
- **Multi-tenant**: every data row carries a `tenant_id`; app-layer guards plus Row-Level Security prevent cross-tenant access

---

## Journey Documents

| # | File | Journey | Primary Actor |
|---|------|---------|---------------|
| 01 | [01-registration-onboarding.md](./01-registration-onboarding.md) | Registration and email verification | New user |
| 02 | [02-authentication.md](./02-authentication.md) | Login, magic link, logout, protected routes | All roles |
| 03 | [03-assessment-lifecycle.md](./03-assessment-lifecycle.md) | Full assessment CRUD + submit | tenant_admin |
| 04 | [04-assessor-journey.md](./04-assessor-journey.md) | Assessor fills and saves responses | assessor |
| 05 | [05-reviewer-journey.md](./05-reviewer-journey.md) | Review, score, and generate report | reviewer |
| 06 | [06-platform-admin.md](./06-platform-admin.md) | Platform admin dashboard and stats | platform_admin |
| 07 | [07-tenant-management.md](./07-tenant-management.md) | Tenant settings and partner CRUD | tenant_admin |
| 08 | [08-user-management.md](./08-user-management.md) | User CRUD within a tenant | tenant_admin |
| 09 | [09-file-upload.md](./09-file-upload.md) | File upload within assessment forms | tenant_admin / assessor |
| 10 | [10-benchmarking.md](./10-benchmarking.md) | Benchmarking and peer comparison | tenant_admin |
| 11 | [11-error-edge-cases.md](./11-error-edge-cases.md) | Error handling and edge cases | Various |

---

## How to Run

### Prerequisites

All services must be running via Docker Compose (from `infrastructure/`):

- **Backend API** at `http://localhost:8000`
- **Frontend** at `http://localhost:3000`
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Celery worker** (for AI scoring/report jobs)
- **MinIO** on port 9000 (S3-compatible file storage)
- **Mailpit** at `http://localhost:8025` (SMTP capture for email verification)

### Seed Data

```bash
cd backend
python -m scripts.seed_e2e_data
```

This creates the pre-seeded users, tenants, templates, and sample data referenced in the test fixtures.

### Run All Tests

```bash
cd e2e
npm test
```

### Run a Specific Spec

```bash
npx playwright test tests/01-registration.spec.ts
```

### Headed Mode (Watch the Browser)

```bash
npm run test:headed
```

### Debug Mode (Step Through)

```bash
npm run test:debug
```

### Interactive UI Mode

```bash
npm run test:ui
```

### View Last Report

```bash
npm run report
```

---

## Directory Structure

```
e2e/
  docs/                  <-- You are here. Journey documentation.
  fixtures/
    test-data.ts         <-- Credentials, sample responses, constants
    api-seeder.ts        <-- Direct HTTP client for API setup/teardown
    mailpit.ts           <-- Mailpit API helper for email token extraction
    auth.fixture.ts      <-- Pre-authenticated Page fixtures per role
  helpers/
    field-helpers.ts     <-- Locate and interact with all 12 field types
    wait-helpers.ts      <-- Poll async jobs, wait for auto-save
  pages/                 <-- Page Object Models (to be created per spec)
  tests/                 <-- Playwright test specs
  playwright.config.ts   <-- Playwright configuration
  global-setup.ts        <-- Service health checks + seed verification
  global-teardown.ts     <-- Post-run cleanup
  package.json           <-- npm scripts
  tsconfig.json          <-- TypeScript configuration
```

---

## Conventions

- **One spec file per journey document** (e.g., `01-registration-onboarding.md` maps to `tests/01-registration.spec.ts`).
- Tests run sequentially (`fullyParallel: false`, `workers: 1`) to avoid race conditions on shared seed data.
- Authentication fixtures inject JWT tokens into `localStorage` via the API, skipping the login UI for most tests.
- API calls in setup/teardown use the `ApiSeeder` class from `fixtures/api-seeder.ts`.
- Email token extraction uses the `MailpitClient` class from `fixtures/mailpit.ts`.
- Field interactions use helpers from `helpers/field-helpers.ts` that locate fields by item code (e.g., "TL01").
