# Journey 07 -- Tenant Management

## Actor

**tenant_admin** -- manages their own tenant's settings and partner institutions.

## Preconditions

- The `tenant_admin` user is pre-seeded and logged in.
- The tenant (`E2E Test University`) exists with known properties.
- Credentials: `e2e-admin@demo-university.ac.uk` / `TestPass123!` (from `USERS.tenantAdmin`).

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Get current tenant | API | `GET /api/v1/tenants/current` |
| Update current tenant | API | `PUT /api/v1/tenants/current` |
| List partners | API | `GET /api/v1/tenants/current/partners` |
| Create partner | API | `POST /api/v1/tenants/current/partners` |
| Delete partner | API | `DELETE /api/v1/tenants/current/partners/{id}` |

---

## Step-by-Step Flow

### Step 1: Read Current Tenant

1. Using `ApiSeeder`, call:
   ```typescript
   const tenant = await api.getCurrentTenant(tenantAdminToken);
   ```
2. This calls `GET /api/v1/tenants/current`.
3. The response contains the tenant details:
   ```json
   {
     "id": "<uuid>",
     "name": "E2E Test University",
     "slug": "e2e-test-university",
     "country": "United Kingdom"
   }
   ```
4. Verify the tenant name and slug match the seeded values.

### Step 2: Update Current Tenant

1. Update the tenant's name:
   ```typescript
   const updated = await api.updateCurrentTenant(tenantAdminToken, {
     name: "E2E Test University (Updated)"
   });
   ```
2. This calls `PUT /api/v1/tenants/current`.
3. Verify the returned tenant has the updated name.
4. Re-read the tenant to confirm persistence:
   ```typescript
   const refreshed = await api.getCurrentTenant(tenantAdminToken);
   ```
5. Verify `refreshed.name === "E2E Test University (Updated)"`.
6. Restore the original name for subsequent tests:
   ```typescript
   await api.updateCurrentTenant(tenantAdminToken, { name: "E2E Test University" });
   ```

### Step 3: List Partners

1. Using `ApiSeeder`, call:
   ```typescript
   const partners = await api.listPartners(tenantAdminToken);
   ```
2. This calls `GET /api/v1/tenants/current/partners`.
3. The response is an array of partner objects, each with `id`, `name`, and `country`.
4. Note the initial count for later comparison.

### Step 4: Create Partners

1. Create a new partner:
   ```typescript
   const partner1 = await api.createPartner(tenantAdminToken, {
     name: "E2E Partner University A",
     country: "Malaysia",
   });
   ```
2. This calls `POST /api/v1/tenants/current/partners`.
3. Verify the response includes the partner's `id`, `name`, and `country`.
4. Create additional partners to test the limit:
   ```typescript
   const partner2 = await api.createPartner(tenantAdminToken, {
     name: "E2E Partner University B",
     country: "Singapore",
   });
   ```

### Step 5: Enforce Maximum Partner Limit

1. Continue creating partners until reaching the maximum (5 partners total).
2. Attempt to create a 6th partner:
   ```typescript
   const result = await api.rawRequest("POST", "/tenants/current/partners", {
     token: tenantAdminToken,
     body: { name: "E2E Partner Overflow", country: "Thailand" },
   });
   ```
3. Verify the response is an error (HTTP 400 or 409) indicating the maximum partner limit has been reached.

### Step 6: Delete Partners (Cleanup)

1. Delete the test partners created during this test:
   ```typescript
   await api.deletePartner(tenantAdminToken, partner1.id);
   await api.deletePartner(tenantAdminToken, partner2.id);
   ```
2. This calls `DELETE /api/v1/tenants/current/partners/{id}`.
3. Verify the partner count returns to the pre-test level.

---

## Assertions

### Tenant Read/Update

| # | Assertion |
|---|-----------|
| A1 | `GET /tenants/current` returns the correct tenant name and slug |
| A2 | `PUT /tenants/current` updates the tenant name |
| A3 | Updated name is persisted when re-read |

### Partner CRUD

| # | Assertion |
|---|-----------|
| A4 | `GET /tenants/current/partners` returns an array |
| A5 | `POST /tenants/current/partners` creates a new partner and returns its details |
| A6 | Created partner appears in the partner list |
| A7 | Maximum partner limit (5) is enforced -- attempting to exceed it returns an error |
| A8 | `DELETE /tenants/current/partners/{id}` removes the partner |
| A9 | Deleted partner no longer appears in the list |

### Authorization

| # | Assertion |
|---|-----------|
| A10 | Only `tenant_admin` (and `platform_admin`) can update tenant settings |
| A11 | An `assessor` or `reviewer` token on `PUT /tenants/current` returns 403 |

---

## Related Test Spec

```
e2e/tests/07-tenant-management.spec.ts
```

## Fixtures Used

- `ApiSeeder` from `fixtures/api-seeder.ts` -- for all API operations.
- `USERS.tenantAdmin` from `fixtures/test-data.ts` -- credentials.
- `TENANT` from `fixtures/test-data.ts` -- expected tenant name and slug.

## Notes

- This journey is entirely API-level in Phase 1. The UI for tenant management and partner CRUD is planned for a future phase. Tests interact with the API directly using `ApiSeeder`.
- The partner limit of 5 is an application-level constraint. The exact error response (status code and message) should be verified against the backend implementation.
- Cleanup is important: tests should delete any partners they create to avoid affecting subsequent test runs.
- The `tenant_admin` can only manage their own tenant. Attempting to manage another tenant's partners would result in a 404 (tenant scoping prevents cross-tenant access).
