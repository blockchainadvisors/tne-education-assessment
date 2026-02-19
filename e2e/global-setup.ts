/**
 * Playwright global setup — runs once before all tests.
 *
 * Verifies that backend, frontend, and Mailpit are reachable,
 * then ensures E2E seed data exists.
 */

import { API_URL, MAILPIT_URL, USERS } from "./fixtures/test-data";

async function checkService(name: string, url: string): Promise<void> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) {
      console.warn(`  [warn] ${name} returned ${response.status} at ${url}`);
    } else {
      console.log(`  [ok] ${name} is reachable at ${url}`);
    }
  } catch (err) {
    throw new Error(
      `${name} is not reachable at ${url}. Ensure all services are running.\n${err}`
    );
  }
}

async function verifySeededUsers(): Promise<void> {
  // Try logging in as each seeded user to confirm they exist & are verified
  for (const [key, user] of Object.entries(USERS)) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, password: user.password }),
      });

      if (response.ok) {
        console.log(`  [ok] ${key} (${user.email}) - login successful`);
      } else {
        const data = await response.json().catch(() => ({}));
        console.warn(
          `  [warn] ${key} (${user.email}) - login failed: ${response.status} ${(data as Record<string, string>).detail || ""}`
        );
        console.warn(
          `         Run: cd backend && python -m scripts.seed_e2e_data`
        );
      }
    } catch (err) {
      console.warn(`  [warn] ${key} (${user.email}) - request failed: ${err}`);
    }
  }
}

export default async function globalSetup(): Promise<void> {
  console.log("\n--- E2E Global Setup ---\n");

  // 1. Check services
  console.log("Checking services...");
  await checkService("Backend API", `${API_URL}/auth/login`);
  await checkService(
    "Frontend",
    process.env.BASE_URL || "http://localhost:3000"
  );
  await checkService("Mailpit", `${MAILPIT_URL}/api/v1/messages`);

  // 2. Verify seeded users
  console.log("\nVerifying seeded test users...");
  await verifySeededUsers();

  // 3. Clear Mailpit inbox for clean test run
  console.log("\nClearing Mailpit inbox...");
  try {
    await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });
    console.log("  [ok] Mailpit inbox cleared");
  } catch {
    console.warn("  [warn] Could not clear Mailpit inbox");
  }

  console.log("\n--- Setup Complete ---\n");
}
