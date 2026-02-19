/**
 * Helpers for polling async operations:
 * - AI job completion (scoring, report generation)
 * - Auto-save confirmation
 */

import type { Page } from "@playwright/test";
import { api } from "../fixtures/api-seeder";

interface JobResult {
  id: string;
  status: string;
  error_message: string | null;
}

/**
 * Poll a Celery job until it reaches a terminal state (completed/failed).
 * Returns the final job status.
 *
 * @param token - Bearer token for API auth
 * @param jobId - The AI job ID to poll
 * @param timeout - Max time to wait in ms (default 60s)
 * @param interval - Poll interval in ms (default 2s)
 */
export async function waitForJob(
  token: string,
  jobId: string,
  timeout = 60_000,
  interval = 2_000
): Promise<JobResult> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const job = await api.getJobStatus(token, jobId);

    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error(`Job ${jobId} did not complete within ${timeout}ms`);
}

/**
 * Wait for the auto-save indicator to show "Saved" on the assessment edit page.
 */
export async function waitForAutoSave(
  page: Page,
  timeout = 10_000
): Promise<void> {
  // Wait for "Saving..." to appear and then resolve to "Saved"
  await page
    .getByText("Saved")
    .waitFor({ state: "visible", timeout });
}

/**
 * Wait for the save status to transition from "Saving..." to "Saved".
 * Useful when triggering manual save.
 */
export async function waitForManualSave(
  page: Page,
  timeout = 10_000
): Promise<void> {
  // May briefly show "Saving..."
  try {
    await page
      .getByText("Saving...")
      .waitFor({ state: "visible", timeout: 3000 });
  } catch {
    // May have already finished
  }
  await page
    .getByText("Saved")
    .waitFor({ state: "visible", timeout });
}

/**
 * Wait for page navigation to complete with a specific URL pattern.
 */
export async function waitForNavigation(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 15_000
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * General-purpose retry helper.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number; shouldRetry?: (err: unknown) => boolean } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, shouldRetry = () => true } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries || !shouldRetry(err)) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw new Error("Unreachable");
}
