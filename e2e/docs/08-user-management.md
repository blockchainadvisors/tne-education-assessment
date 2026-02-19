# Journey 08 -- User Management

## Actor

**tenant_admin** -- manages users within their own tenant. Can list, create, and update users with various roles.

## Preconditions

- The `tenant_admin` user is pre-seeded and logged in.
- The tenant has at least the 3 pre-seeded users: `tenant_admin`, `assessor`, `reviewer`.
- Credentials: `e2e-admin@demo-university.ac.uk` / `TestPass123!` (from `USERS.tenantAdmin`).

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| List users | API | `GET /api/v1/users` |
| Get current user | API | `GET /api/v1/users/me` |
| Create user | API | `POST /api/v1/users` |
| Update user | API | `PUT /api/v1/users/{id}` |

---

## Step-by-Step Flow

### Step 1: List Users

1. Using `ApiSeeder`, call:
   ```typescript
   const users = await api.listUsers(tenantAdminToken);
   ```
2. This calls `GET /api/v1/users`.
3. The response is an array of user objects, each with `id`, `email`, and `role`.
4. Verify the list contains the pre-seeded users:
   - `e2e-admin@demo-university.ac.uk` with role `tenant_admin`
   - `e2e-assessor@demo-university.ac.uk` with role `assessor`
   - `e2e-reviewer@demo-university.ac.uk` with role `reviewer`
5. All returned users belong to the same tenant (tenant scoping is enforced).

### Step 2: Get Current User

1. Using `ApiSeeder`, call:
   ```typescript
   const me = await api.getMe(tenantAdminToken);
   ```
2. This calls `GET /api/v1/users/me`.
3. Verify the response contains:
   - `email`: `"e2e-admin@demo-university.ac.uk"`
   - `role`: `"tenant_admin"`

### Step 3: Create a New User with `assessor` Role

1. Generate a unique email to avoid conflicts:
   ```typescript
   const newEmail = `e2e-new-assessor-${Date.now()}@demo-university.ac.uk`;
   ```
2. Create the user:
   ```typescript
   const newUser = await api.createUser(tenantAdminToken, {
     email: newEmail,
     password: "NewUserPass123!",
     full_name: "E2E New Assessor",
     role: "assessor",
   });
   ```
3. This calls `POST /api/v1/users`.
4. Verify the response includes:
   - `id`: a valid UUID
   - `email`: the provided email
   - `role`: `"assessor"`

### Step 4: Create a New User with `reviewer` Role

1. Repeat with a different email and the `reviewer` role:
   ```typescript
   const reviewerEmail = `e2e-new-reviewer-${Date.now()}@demo-university.ac.uk`;
   const newReviewer = await api.createUser(tenantAdminToken, {
     email: reviewerEmail,
     password: "NewUserPass123!",
     full_name: "E2E New Reviewer",
     role: "reviewer",
   });
   ```
2. Verify the user is created with `role: "reviewer"`.

### Step 5: Create a New User with `institution_user` Role

1. Repeat with the `institution_user` role:
   ```typescript
   const instEmail = `e2e-new-inst-${Date.now()}@demo-university.ac.uk`;
   const newInst = await api.createUser(tenantAdminToken, {
     email: instEmail,
     password: "NewUserPass123!",
     full_name: "E2E Institution User",
     role: "institution_user",
   });
   ```
2. Verify the user is created with `role: "institution_user"`.

### Step 6: Verify New Users Appear in List

1. Re-fetch the user list:
   ```typescript
   const updatedUsers = await api.listUsers(tenantAdminToken);
   ```
2. Verify the list now includes the 3 newly created users.
3. Verify the total count increased by 3.

### Step 7: Update User Role

1. Update the newly created assessor's role to `reviewer`:
   ```typescript
   const updated = await api.updateUser(tenantAdminToken, newUser.id, {
     role: "reviewer",
   });
   ```
2. This calls `PUT /api/v1/users/{id}`.
3. Verify the response shows `role: "reviewer"`.
4. Re-fetch the user list and confirm the change.

### Step 8: Duplicate Email Error

1. Attempt to create a user with an email that already exists:
   ```typescript
   const result = await api.rawRequest("POST", "/users", {
     token: tenantAdminToken,
     body: {
       email: "e2e-assessor@demo-university.ac.uk",
       password: "AnyPass123!",
       full_name: "Duplicate User",
       role: "assessor",
     },
   });
   ```
2. Verify the response is HTTP **409 Conflict**.
3. Verify the error detail mentions duplicate email.

---

## Assertions

### List Users

| # | Assertion |
|---|-----------|
| A1 | `GET /users` returns an array of user objects |
| A2 | Pre-seeded users (tenant_admin, assessor, reviewer) are present |
| A3 | All returned users belong to the current tenant |

### Get Me

| # | Assertion |
|---|-----------|
| A4 | `GET /users/me` returns the authenticated user's profile |
| A5 | Email and role match the expected values |

### Create User

| # | Assertion |
|---|-----------|
| A6 | `POST /users` creates a user with the specified role |
| A7 | Newly created users appear in subsequent `GET /users` calls |
| A8 | Users can be created with roles: `assessor`, `reviewer`, `institution_user` |

### Update User

| # | Assertion |
|---|-----------|
| A9 | `PUT /users/{id}` updates the user's role |
| A10 | Updated role is reflected in the user list |

### Error Cases

| # | Assertion |
|---|-----------|
| A11 | Creating a user with a duplicate email returns HTTP 409 |
| A12 | The error response detail mentions the duplicate email |

---

## Related Test Spec

```
e2e/tests/08-user-management.spec.ts
```

## Fixtures Used

- `ApiSeeder` from `fixtures/api-seeder.ts` -- for all user CRUD operations.
- `USERS.tenantAdmin` from `fixtures/test-data.ts` -- credentials for API calls.

## Notes

- This journey is entirely API-level in Phase 1. User management UI is planned for a future phase.
- The `tenant_admin` can only manage users within their own tenant. The `tenant_id` is automatically inferred from the authenticated user's token; it does not need to be passed explicitly.
- Created users inherit the `tenant_id` of the admin who creates them.
- Duplicate email detection is global (not per-tenant), since emails are unique across the entire platform.
- Test cleanup: in practice, created test users are left in place (the seed reset script handles cleanup). If needed, user deletion can be added to the API and test teardown.
