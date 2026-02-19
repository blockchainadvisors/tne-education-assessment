# Journey 11 -- Error Handling and Edge Cases

## Overview

This document covers error conditions, boundary cases, and security scenarios that the E2E tests should verify. These test negative paths and ensure the platform handles failures gracefully.

---

## Edge Case 1: Expired or Invalid Verification Token

### Actor
New user who registered but uses a bad verification token.

### Preconditions
None (uses a fabricated or expired token).

### Route
- UI: `/verify-email?token=invalid-or-expired-token`
- API: `POST /api/v1/auth/verify-email?token=invalid-or-expired-token`

### Steps

1. Navigate to `/verify-email?token=this-is-not-a-real-token`.
2. The frontend calls `POST /api/v1/auth/verify-email?token=this-is-not-a-real-token`.
3. The API returns HTTP **400 Bad Request** with:
   ```json
   { "detail": "Invalid or expired verification token" }
   ```
4. The UI displays "Verification failed" or a similar error message.

### Assertions

| # | Assertion |
|---|-----------|
| A1 | API returns HTTP 400 |
| A2 | Error detail is "Invalid or expired verification token" |
| A3 | UI shows a failure message (not a blank page or crash) |
| A4 | No tokens are stored in localStorage |
| A5 | User is not auto-logged in |

---

## Edge Case 2: Expired or Invalid Magic Link

### Actor
User who clicks an expired magic link.

### Preconditions
None (uses a fabricated or expired token).

### Route
- UI: `/magic-link?token=expired-or-invalid-token`
- API: `POST /api/v1/auth/magic-link/verify` with `{ "token": "expired-or-invalid-token" }`

### Steps

1. Navigate to `/magic-link?token=bad-magic-link-token`.
2. The frontend calls `POST /api/v1/auth/magic-link/verify` with the invalid token.
3. The API returns HTTP **400 Bad Request** with:
   ```json
   { "detail": "Invalid or expired magic link" }
   ```
4. The UI displays "Sign-in failed" or a similar error message.

### Assertions

| # | Assertion |
|---|-----------|
| B1 | API returns HTTP 400 |
| B2 | Error detail is "Invalid or expired magic link" |
| B3 | UI shows a failure message |
| B4 | No tokens are stored in localStorage |
| B5 | User is not auto-logged in |

---

## Edge Case 3: Unauthorized Role Access (403 Forbidden)

### Actor
User with insufficient role permissions.

### Preconditions
- Authenticated as `assessor` (or another role without admin privileges).

### Endpoints Tested

| Endpoint | Required Role | Test With |
|----------|---------------|-----------|
| `POST /assessments/{id}/scores/trigger-scoring` | reviewer, tenant_admin, platform_admin | assessor token |
| `POST /assessments/{id}/report/generate` | reviewer, tenant_admin, platform_admin | assessor token |
| `POST /assessments/{id}/status/{status}` | reviewer, tenant_admin, platform_admin | assessor token |
| `GET /admin/stats` | platform_admin | tenant_admin token |
| `GET /admin/tenants` | platform_admin | tenant_admin token |

### Steps

1. Obtain an `assessor` token via `ApiSeeder.getToken("assessor")`.
2. Attempt each restricted endpoint:
   ```typescript
   const result = await api.rawRequest(
     "POST",
     `/assessments/${assessmentId}/scores/trigger-scoring`,
     { token: assessorToken }
   );
   ```
3. Verify each returns HTTP **403 Forbidden**.

### Assertions

| # | Assertion |
|---|-----------|
| C1 | Assessor cannot trigger scoring (403) |
| C2 | Assessor cannot generate reports (403) |
| C3 | Assessor cannot change assessment status (403) |
| C4 | Non-platform_admin cannot access `/admin/stats` (403) |
| C5 | Non-platform_admin cannot access `/admin/tenants` (403) |

---

## Edge Case 4: Cross-Tenant Access (404 Not Found)

### Actor
User from Tenant A trying to access Tenant B's data.

### Preconditions
- Two tenants exist: `E2E Test University` and `E2E Other Institute`.
- An assessment exists for Tenant A.

### Steps

1. Create an assessment under Tenant A (using the `tenantAdmin` for Tenant A).
2. Obtain a token for a user from Tenant B (if a second tenant has a seeded user, or create one via API).
3. Attempt to access Tenant A's assessment from Tenant B:
   ```typescript
   const result = await api.rawRequest(
     "GET",
     `/assessments/${tenantA_assessmentId}`,
     { token: tenantB_token }
   );
   ```
4. Verify the response is HTTP **404 Not Found** (the assessment does not exist in Tenant B's scope).

### Assertions

| # | Assertion |
|---|-----------|
| D1 | Cross-tenant assessment access returns 404 |
| D2 | Cross-tenant response access returns 404 |
| D3 | No data from Tenant A is leaked to Tenant B |

---

## Edge Case 5: Duplicate Tenant Slug (409 Conflict)

### Actor
New user registering with a slug that already exists.

### Route
- API: `POST /api/v1/auth/register`

### Steps

1. Attempt to register with a slug that matches an existing tenant:
   ```typescript
   const result = await api.rawRequest("POST", "/auth/register", {
     body: {
       full_name: "Duplicate Slug User",
       email: `dup-slug-${Date.now()}@test.local`,
       password: "Password123!",
       tenant_name: "Duplicate Org",
       tenant_slug: "e2e-test-university",  // Already exists
       country: "United Kingdom",
     },
   });
   ```
2. Verify the response is HTTP **409 Conflict** with:
   ```json
   { "detail": "Tenant slug already taken" }
   ```

### Assertions

| # | Assertion |
|---|-----------|
| E1 | Duplicate tenant slug returns HTTP 409 |
| E2 | Error detail is "Tenant slug already taken" |
| E3 | No tenant or user is created |

---

## Edge Case 6: Rate Limiting (429 Too Many Requests)

### Actor
Any user triggering rate-limited endpoints.

### Endpoints Tested
- `POST /api/v1/auth/magic-link` -- limited to 3 per 60 seconds per email.
- `POST /api/v1/auth/resend-verification` -- limited to 3 per 60 seconds per email.

### Steps

1. Send the magic link request 4 times rapidly for the same email:
   ```typescript
   for (let i = 0; i < 4; i++) {
     const result = await api.rawRequest("POST", "/auth/magic-link", {
       body: { email: "e2e-admin@demo-university.ac.uk" },
     });
     if (i < 3) {
       // First 3 should succeed (200)
     } else {
       // 4th should be rate-limited (429)
     }
   }
   ```
2. Verify the 4th request returns HTTP **429 Too Many Requests** with:
   ```json
   { "detail": "Too many requests. Please try again later." }
   ```

### Assertions

| # | Assertion |
|---|-----------|
| F1 | First 3 magic link requests return HTTP 200 |
| F2 | 4th request returns HTTP 429 |
| F3 | Error detail is "Too many requests. Please try again later." |
| F4 | Same behavior applies to resend-verification endpoint |

---

## Edge Case 7: Missing Required Fields

### Actor
User or API client submitting incomplete data.

### Endpoints Tested

| Endpoint | Missing Field | Expected |
|----------|---------------|----------|
| `POST /auth/register` | Missing `email` | 422 Unprocessable Entity |
| `POST /auth/login` | Missing `password` | 422 Unprocessable Entity |
| `POST /assessments` | Missing `template_id` | 422 Unprocessable Entity |
| `POST /users` | Missing `role` | 422 Unprocessable Entity |

### Steps

1. For each endpoint, send a request with a required field missing:
   ```typescript
   const result = await api.rawRequest("POST", "/auth/register", {
     body: {
       full_name: "No Email User",
       // email is missing
       password: "Password123!",
       tenant_name: "Some Org",
       tenant_slug: "some-org",
       country: "UK",
     },
   });
   ```
2. Verify the response is HTTP **422 Unprocessable Entity**.
3. The response body should contain validation error details from Pydantic.

### Assertions

| # | Assertion |
|---|-----------|
| G1 | Missing `email` on register returns 422 |
| G2 | Missing `password` on login returns 422 |
| G3 | Missing `template_id` on assessment create returns 422 |
| G4 | Response body contains field-level validation errors |

---

## Edge Case 8: Deactivated Account (403 Forbidden)

### Actor
A user whose account has been deactivated (`is_active = False`).

### Route
- API: `POST /api/v1/auth/login`

### Steps

1. Attempt to log in with a deactivated user's credentials.
2. The API returns HTTP **403 Forbidden** with:
   ```json
   { "detail": "Account is deactivated" }
   ```

### Assertions

| # | Assertion |
|---|-----------|
| H1 | Login with deactivated account returns HTTP 403 |
| H2 | Error detail is "Account is deactivated" |

---

## Related Test Spec

```
e2e/tests/11-error-edge-cases.spec.ts
```

## Fixtures Used

- `ApiSeeder` (with `rawRequest()`) from `fixtures/api-seeder.ts` -- for sending requests and inspecting raw status codes.
- `USERS` from `fixtures/test-data.ts` -- credentials for various roles.
- `TENANT` from `fixtures/test-data.ts` -- existing tenant slug for duplicate testing.

## Notes

- The `rawRequest()` method on `ApiSeeder` returns `{ status, body }` without throwing on errors, making it ideal for testing error responses.
- Rate limiting uses an in-memory counter per email per action type. The counter resets after 60 seconds. Tests should be aware that previous test runs may have consumed some of the rate limit budget.
- Cross-tenant isolation relies on the `tenant_id` in the JWT token. The backend filters all queries by `tenant_id`, so attempting to access another tenant's data returns 404 (not 403), which avoids leaking information about the existence of resources.
- Pydantic validation errors (422) return a structured response body with `detail` as an array of field-level errors.
