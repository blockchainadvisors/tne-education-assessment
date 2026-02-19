/**
 * Playwright global teardown — runs once after all tests complete.
 *
 * Performs optional cleanup tasks. The E2E seed data is intentionally
 * left in place so tests can be re-run without re-seeding.
 */

export default async function globalTeardown(): Promise<void> {
  console.log("\n--- E2E Global Teardown ---\n");
  console.log("  Tests complete. Seed data left intact for re-runs.");
  console.log("  To reset: re-run `python -m scripts.seed_e2e_data --reset`");
  console.log("\n--- Teardown Complete ---\n");
}
