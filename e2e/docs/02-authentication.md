# Journey 02 -- Authentication

## Overview

This journey covers all authentication flows in the platform: password-based login, magic link login, invalid credential handling, unverified email rejection, logout, and protected route redirection.

---

## Sub-Flow A: Password Login

### Actor
Any pre-seeded user (e.g., `tenant_admin`).

### Preconditions
- User exists in the database with `email_verified = True`.
- Seed data has been loaded via `python -m scripts.seed_e2e_data`.

### Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Login form | UI | `/login` |
| API login | API | `POST /api/v1/auth/login` |
| Dashboard | UI | `/dashboard` |

### Steps

1. Navigate to `/login`.
2. Verify the login form renders with Email and Password fields, plus a "Sign In" button.
3. Fill in `email` and `password` using `USERS.tenantAdmin` credentials from `fixtures/test-data.ts`.
4. Click the "Sign In" button.
5. The frontend calls `POST /api/v1/auth/login` with `{ email, password }`.
6. The API returns `{ access_token, refresh_token }`.
7. Tokens are stored in `localStorage`.
8. The browser redirects to `/dashboard`.

### Assertions

| # | Assertion |
|---|-----------|
| A1 | Login form is visible with email and password inputs |
| A2 | Successful login stores `access_token` in localStorage |
| A3 | Successful login stores `refresh_token` in localStorage |
| A4 | Browser redirects to `/dashboard` after login |
| A5 | Dashboard displays the user's name or role-appropriate content |

---

## Sub-Flow B: Magic Link Login

### Actor
Any pre-seeded, verified user.

### Preconditions
- User exists with `email_verified = True` and `is_active = True`.
- Mailpit is running.

### Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Login page (magic link tab/link) | UI | `/login` |
| Request magic link | API | `POST /api/v1/auth/magic-link` |
| Email token extraction | Service | Mailpit API |
| Magic link verification page | UI | `/magic-link?token={token}` |
| Verify magic link | API | `POST /api/v1/auth/magic-link/verify` |
| Dashboard | UI | `/dashboard` |

### Steps

1. Navigate to `/login`.
2. Click the "Sign in with magic link" option (or navigate directly).
3. Enter the user's email address.
4. Submit the magic link request form.
5. The frontend calls `POST /api/v1/auth/magic-link` with `{ email }`.
6. The API returns `{ "message": "If an account exists with that email, a sign-in link has been sent." }` (constant message to prevent enumeration).
7. Use `MailpitClient.getMagicLinkToken(email)` to wait for and extract the token from the email (subject contains "Sign").
8. Navigate to `/magic-link?token={token}`.
9. The frontend calls `POST /api/v1/auth/magic-link/verify` with `{ token }`.
10. The API returns `{ access_token, refresh_token }`.
11. Tokens are stored in `localStorage`.
12. Browser redirects to `/dashboard`.

### Assertions

| # | Assertion |
|---|-----------|
| B1 | Magic link request returns success message regardless of whether email exists |
| B2 | Email arrives in Mailpit within 15 seconds |
| B3 | Email contains a valid token URL |
| B4 | Navigating to `/magic-link?token=...` stores tokens in localStorage |
| B5 | Browser redirects to `/dashboard` |

---

## Sub-Flow C: Invalid Credentials

### Actor
Unauthenticated user.

### Preconditions
None specific.

### Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Login form | UI | `/login` |
| API login | API | `POST /api/v1/auth/login` |

### Steps

1. Navigate to `/login`.
2. Enter a valid email and an incorrect password.
3. Click "Sign In".
4. The API returns HTTP 401 with `{ "detail": "Invalid email or password" }`.
5. The UI displays an error message.

### Assertions

| # | Assertion |
|---|-----------|
| C1 | API returns HTTP 401 |
| C2 | Error message "Invalid email or password" is displayed on the page |
| C3 | No tokens are stored in localStorage |
| C4 | User remains on `/login` |

---

## Sub-Flow D: Unverified Email

### Actor
User who has registered but has not completed email verification.

### Preconditions
- User exists in the database with `email_verified = False`.

### Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Login form | UI | `/login` |
| API login | API | `POST /api/v1/auth/login` |

### Steps

1. Navigate to `/login`.
2. Enter the email and password of an unverified user.
3. Click "Sign In".
4. The API returns HTTP 403 with `{ "detail": "Email not verified. Please check your inbox for the verification link." }`.
5. The UI displays an appropriate error message with guidance to check their inbox.

### Assertions

| # | Assertion |
|---|-----------|
| D1 | API returns HTTP 403 |
| D2 | Error message about email verification is displayed |
| D3 | No tokens are stored in localStorage |
| D4 | User remains on `/login` |

---

## Sub-Flow E: Logout

### Actor
Any authenticated user.

### Preconditions
- User is logged in (tokens in localStorage).

### Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Dashboard or any authenticated page | UI | `/dashboard` |
| API logout | API | `POST /api/v1/auth/logout` |
| Login page | UI | `/login` |

### Steps

1. Start on `/dashboard` as a logged-in user (use `auth.fixture.ts` to pre-authenticate).
2. Locate and click the "Sign Out" / "Logout" button.
3. The frontend calls `POST /api/v1/auth/logout` (which returns `{ "detail": "Successfully logged out" }`).
4. The frontend clears `access_token` and `refresh_token` from localStorage.
5. The browser redirects to `/login`.

### Assertions

| # | Assertion |
|---|-----------|
| E1 | After clicking logout, `access_token` is removed from localStorage |
| E2 | After clicking logout, `refresh_token` is removed from localStorage |
| E3 | Browser redirects to `/login` |
| E4 | Navigating to `/dashboard` after logout redirects back to `/login` |

---

## Sub-Flow F: Protected Route Redirect

### Actor
Unauthenticated visitor.

### Preconditions
- No tokens in localStorage.

### Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Protected page | UI | `/dashboard`, `/assessments`, `/admin`, etc. |
| Redirect | UI | `/login` |

### Steps

1. Ensure no tokens exist in localStorage (fresh browser context).
2. Navigate directly to a protected route such as `/dashboard`.
3. The frontend auth guard detects the missing token and redirects to `/login`.

### Assertions

| # | Assertion |
|---|-----------|
| F1 | Navigating to `/dashboard` without tokens redirects to `/login` |
| F2 | Navigating to `/assessments` without tokens redirects to `/login` |
| F3 | Navigating to `/admin` without tokens redirects to `/login` |
| F4 | The login page loads without errors |

---

## Related Test Spec

```
e2e/tests/02-authentication.spec.ts
```

## Fixtures Used

- `USERS` from `fixtures/test-data.ts` -- pre-seeded user credentials.
- `MailpitClient` from `fixtures/mailpit.ts` -- for magic link token extraction.
- `auth.fixture.ts` -- pre-authenticated Page fixtures for logout tests.

## Notes

- JWTs are stateless (HS256). Logout is client-side only: `POST /auth/logout` is a no-op that returns a success message. Actual token invalidation happens by removing tokens from localStorage.
- The magic link endpoint always returns the same success message (`"If an account exists with that email, a sign-in link has been sent."`) to prevent email enumeration attacks.
- Rate limiting applies to magic link requests and resend-verification requests (3 per 60 seconds per email). See `11-error-edge-cases.md` for rate limit testing.
