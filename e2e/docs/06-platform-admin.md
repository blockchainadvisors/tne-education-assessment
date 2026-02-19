# Journey 06 -- Platform Admin

## Actor

**platform_admin** -- a superuser with cross-tenant visibility. Can view global platform statistics and manage tenants.

## Preconditions

- The `platform_admin` user is pre-seeded and logged in (use `platformAdminPage` fixture from `auth.fixture.ts`).
- Seed data includes at least one tenant with users and assessments.
- Credentials: `e2e-platform@tne-academy.com` / `AdminPass123!` (from `USERS.platformAdmin`).

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Dashboard | UI | `/dashboard` |
| Admin page | UI | `/admin` |
| Admin stats | API | `GET /api/v1/admin/stats` |
| List all tenants | API | `GET /api/v1/admin/tenants` |

---

## Step-by-Step Flow

### Step 1: Login and Dashboard

1. Navigate to `/dashboard` using the `platformAdminPage`.
2. Verify the dashboard loads.
3. The platform admin's dashboard may show cross-tenant summary information or redirect guidance to the admin page.

### Step 2: Navigate to Admin Page

1. Click "Admin" in the sidebar navigation.
2. Verify the URL is `/admin`.
3. The admin page currently shows **placeholder cards** with "Coming Soon" content.
4. Verify the page renders without errors.
5. Verify placeholder cards are visible (Phase 1 -- full admin functionality is planned for a later phase).

### Step 3: View Platform Stats (API)

1. Using `ApiSeeder`, call:
   ```typescript
   const stats = await api.getAdminStats(platformAdminToken);
   ```
2. This calls `GET /api/v1/admin/stats`.
3. The response contains:
   ```json
   {
     "total_tenants": 2,
     "total_users": 5,
     "total_assessments": 3
   }
   ```
4. Verify all counts are numbers greater than or equal to the known seed data counts.

### Step 4: List All Tenants (API)

1. Using `ApiSeeder`, call:
   ```typescript
   const tenants = await api.listAllTenants(platformAdminToken);
   ```
2. This calls `GET /api/v1/admin/tenants`.
3. The response is an array of tenant objects, each with at least `id` and `name`.
4. Verify the list includes the seeded tenants:
   - `"E2E Test University"` (slug: `e2e-test-university`)
   - `"E2E Other Institute"` (slug: `e2e-other-institute`)

### Step 5: Verify Role Restriction

1. Using `ApiSeeder` with a non-admin token (e.g., assessor), attempt:
   ```typescript
   const result = await api.rawRequest("GET", "/admin/stats", { token: assessorToken });
   ```
2. Verify the response is HTTP **403 Forbidden**.
3. Only `platform_admin` should be able to access the `/admin/*` endpoints.

---

## Assertions

### UI

| # | Assertion |
|---|-----------|
| A1 | Admin page at `/admin` loads without errors |
| A2 | Placeholder cards are visible with "Coming Soon" or equivalent text |
| A3 | Sidebar navigation includes an "Admin" link for platform_admin users |

### API -- Stats

| # | Assertion |
|---|-----------|
| A4 | `GET /admin/stats` returns `total_tenants` >= 2 |
| A5 | `GET /admin/stats` returns `total_users` >= 4 (seeded users) |
| A6 | `GET /admin/stats` returns `total_assessments` >= 0 |

### API -- Tenants

| # | Assertion |
|---|-----------|
| A7 | `GET /admin/tenants` returns an array of tenant objects |
| A8 | Tenant list includes "E2E Test University" |
| A9 | Tenant list includes "E2E Other Institute" |

### Authorization

| # | Assertion |
|---|-----------|
| A10 | Non-admin roles receive HTTP 403 on `/admin/stats` |
| A11 | Non-admin roles receive HTTP 403 on `/admin/tenants` |

---

## Related Test Spec

```
e2e/tests/06-platform-admin.spec.ts
```

## Fixtures Used

- `platformAdminPage` from `fixtures/auth.fixture.ts` -- pre-authenticated page as platform admin.
- `ApiSeeder` from `fixtures/api-seeder.ts` -- for API-level stats and tenant queries.
- `USERS.platformAdmin` from `fixtures/test-data.ts` -- credentials.
- `TENANT` and `TENANT_2` from `fixtures/test-data.ts` -- expected tenant names/slugs.

## Notes

- The `/admin` page in Phase 1 is a placeholder. The UI shows styled cards but does not yet display live data. Full admin functionality (tenant management, user oversight, system configuration) is planned for Phase 2+.
- The API endpoints (`/admin/stats`, `/admin/tenants`) are functional and return real data. Tests should verify the API layer even though the UI is not yet wired up.
- The `platform_admin` role is cross-tenant: the user has a `tenant_id` (for their "home" tenant) but API routes bypass tenant scoping for admin operations.
