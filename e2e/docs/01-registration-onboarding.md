# Journey 01 -- Registration and Onboarding

## Actor

**New user** -- someone who has never used the platform before. Upon completing registration, they become a `tenant_admin` for a newly created tenant.

## Preconditions

- No existing account with the test email address.
- No existing tenant with the test slug.
- Mailpit is running and accessible at `http://localhost:8025`.
- Backend API is running at `http://localhost:8000`.
- Frontend is running at `http://localhost:3000`.

## Routes and Endpoints

| Step | Type | Path |
|------|------|------|
| Registration form | UI | `/register` |
| API registration | API | `POST /api/v1/auth/register` |
| Verification pending | UI | `/verify-email-sent` |
| Email token extraction | Service | Mailpit API `GET /api/v1/search?query=to:{email}` |
| Email verification | UI | `/verify-email?token={token}` |
| API verification | API | `POST /api/v1/auth/verify-email?token={token}` |
| Dashboard | UI | `/dashboard` |

---

## Step-by-Step Flow

### Step 1: Navigate to Registration

1. Open `/register`.
2. Verify the registration form is visible with the following fields:
   - Full Name (`full_name`)
   - Email (`email`)
   - Password (`password`)
   - Organisation/Tenant Name (`tenant_name`)
   - Country (`country`)
3. Verify the "Sign In" link is visible for users who already have an account.

### Step 2: Fill Registration Form

1. Generate unique test data using `freshRegistration()` from `fixtures/test-data.ts`:
   - `full_name`: `"Test User {timestamp}"`
   - `email`: `"testuser-{timestamp}@e2e-test.local"`
   - `password`: `"SecurePass123!"`
   - `tenant_name`: `"Test Org {timestamp}"`
   - `tenant_slug`: auto-derived or `"test-org-{timestamp}"`
   - `country`: `"United Kingdom"`
2. Fill all fields in the form.
3. Click the "Register" / "Create Account" button.

### Step 3: Redirect to Verification Pending Page

1. The frontend calls `POST /api/v1/auth/register` with the form data.
2. The API returns `{ "message": "Registration successful. Please check your email to verify your account." }`.
3. The browser redirects to `/verify-email-sent`.
4. Verify the page displays a message instructing the user to check their email.

### Step 4: Extract Verification Token from Mailpit

1. Use `MailpitClient.getVerificationToken(email)` from `fixtures/mailpit.ts`.
2. This polls `GET {MAILPIT_URL}/api/v1/search?query=to:{email}` until an email with "Verify" in the subject arrives (up to 15 seconds).
3. Extracts the `token` parameter from the verification URL in the email HTML body using the regex `/[?&]token=([a-zA-Z0-9._-]+)/`.

### Step 5: Verify Email

1. Navigate to `/verify-email?token={extracted_token}`.
2. The frontend calls `POST /api/v1/auth/verify-email?token={token}`.
3. The API sets `email_verified = True` and `email_verified_at` on the user, then returns a JWT token pair (`access_token` + `refresh_token`).
4. The frontend stores tokens in `localStorage` (`access_token`, `refresh_token`).

### Step 6: Auto-Login and Dashboard

1. After successful verification, the user is automatically logged in.
2. The browser navigates to `/dashboard`.
3. Verify the dashboard page loads and displays a welcome message or the user's name.

---

## Assertions

### Happy Path

| # | Assertion | Method |
|---|-----------|--------|
| A1 | Registration form renders all 5 fields | `page.locator('input[name="full_name"]').isVisible()` etc. |
| A2 | Successful registration redirects to `/verify-email-sent` | `page.waitForURL('/verify-email-sent')` |
| A3 | Verification email is received in Mailpit within 15s | `mailpit.waitForEmail(email, { subjectContains: 'Verify' })` |
| A4 | Email contains a valid verification token URL | `mailpit.extractToken(html) !== null` |
| A5 | Navigating to `/verify-email?token=...` auto-logs in | `localStorage.getItem('access_token') !== null` |
| A6 | Dashboard loads after verification | `page.waitForURL('/dashboard')` |
| A7 | Dashboard shows user's name or welcome message | `page.getByText(fullName).isVisible()` |

### Error Cases

| # | Assertion | Trigger | Expected |
|---|-----------|---------|----------|
| E1 | Duplicate email returns 409 | Register with an already-registered email | API response: `{ "detail": "Email already registered" }` with HTTP 409 |
| E2 | Duplicate tenant slug returns 409 | Register with an already-taken slug | API response: `{ "detail": "Tenant slug already taken" }` with HTTP 409 |
| E3 | Missing required fields show validation errors | Submit form with empty fields | Form-level validation prevents submission; inline error messages appear |
| E4 | Weak password is rejected | Submit form with password `"123"` | Client-side or server-side validation error |
| E5 | Invalid email format is rejected | Submit form with `"not-an-email"` | Form validation error on email field |

---

## Related Test Spec

```
e2e/tests/01-registration.spec.ts
```

## Fixtures Used

- `freshRegistration()` from `fixtures/test-data.ts` -- generates unique registration data per run.
- `MailpitClient` from `fixtures/mailpit.ts` -- waits for and extracts verification tokens from emails.

## Notes

- Each test run generates a unique timestamp-based email and tenant slug to avoid collisions.
- The backend dispatches verification emails via Celery (`send_verification_email_task.delay()`), so there is a small delay before the email arrives in Mailpit.
- The `/verify-email` endpoint returns JWT tokens directly (auto-login), so the user does not need to go through the login form after registration.
