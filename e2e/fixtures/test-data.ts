/**
 * Test data constants — credentials, sample responses, and known values
 * used across all E2E test specs.
 */

export const API_URL = process.env.API_URL || "http://localhost:8000/api/v1";
export const MAILPIT_URL = process.env.MAILPIT_URL || "http://localhost:8025";

// ---------------------------------------------------------------------------
// Pre-seeded user credentials (created by scripts/seed_e2e_data.py)
// ---------------------------------------------------------------------------

export const USERS = {
  tenantAdmin: {
    email: "e2e-admin@demo-university.ac.uk",
    password: "TestPass123!",
    fullName: "E2E Admin User",
    role: "tenant_admin" as const,
  },
  assessor: {
    email: "e2e-assessor@demo-university.ac.uk",
    password: "TestPass123!",
    fullName: "E2E Assessor User",
    role: "assessor" as const,
  },
  reviewer: {
    email: "e2e-reviewer@demo-university.ac.uk",
    password: "TestPass123!",
    fullName: "E2E Reviewer User",
    role: "reviewer" as const,
  },
  platformAdmin: {
    email: "e2e-platform@tne-academy.com",
    password: "AdminPass123!",
    fullName: "E2E Platform Admin",
    role: "platform_admin" as const,
  },
} as const;

export type UserKey = keyof typeof USERS;

// ---------------------------------------------------------------------------
// Tenant info (from seed)
// ---------------------------------------------------------------------------

export const TENANT = {
  name: "E2E Test University",
  slug: "e2e-test-university",
  country: "United Kingdom",
} as const;

export const TENANT_2 = {
  name: "E2E Other Institute",
  slug: "e2e-other-institute",
  country: "Australia",
} as const;

// ---------------------------------------------------------------------------
// Registration test data (unique per run to avoid conflicts)
// ---------------------------------------------------------------------------

export function freshRegistration() {
  const ts = Date.now();
  return {
    full_name: `Test User ${ts}`,
    email: `testuser-${ts}@example.com`,
    password: "SecurePass123!",
    tenant_name: `Test Org ${ts}`,
    tenant_slug: `test-org-${ts}`,
    country: "United Kingdom",
  };
}

// ---------------------------------------------------------------------------
// Sample assessment field responses (keyed by item code)
// ---------------------------------------------------------------------------

export const SAMPLE_RESPONSES: Record<string, unknown> = {
  // Teaching & Learning
  TL01: { value: "Comprehensive quality assurance framework for TNE delivery" },
  TL02: { value: "Annual review cycle with external examiner input" },
  TL03: { value: 85 },
  TL04: { value: 92 },
  TL05: { value: "yes", details: "Regular staff development programmes in place" },

  // Student Experience
  SE01: { value: "Dedicated student support services at partner locations" },
  SE02: { value: 78 },
  SE03: { value: "Multiple channels including online and face-to-face" },

  // Governance
  GV01: { value: "Joint academic board with quarterly meetings" },
  GV02: { value: "yes", details: "Formal partnership agreement renewed annually" },
  GV03: { value: "Shared governance framework document" },

  // Institutional Management
  IM01: { value: "Centralised TNE management office coordinates all partnerships" },
  IM02: { value: 15 },
  IM03: { value: "Dedicated budget allocation for TNE activities" },

  // Financial
  FN01: { value: 250000 },
  FN02: { value: 45 },
  FN03: { value: "Transparent fee-sharing model with partners" },
};

// ---------------------------------------------------------------------------
// Academic year constants
// ---------------------------------------------------------------------------

export const ACADEMIC_YEAR = "2025-2026";
export const ACADEMIC_YEAR_ALT = "2024-2025";
