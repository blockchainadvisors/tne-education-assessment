import { type Page, type Locator } from "@playwright/test";

export class BenchmarksPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly insufficientDataHeading: Locator;
  readonly insufficientDataDescription: Locator;
  readonly phase1Alert: Locator;

  constructor(page: Page) {
    this.page = page;
    // PageHeader renders h1 "Benchmarks"
    this.pageTitle = page.getByRole("heading", { level: 1, name: "Benchmarks" });
    // EmptyState renders h3 "Insufficient Peer Data"
    this.insufficientDataHeading = page.getByRole("heading", { name: "Insufficient Peer Data" });
    // EmptyState description text
    this.insufficientDataDescription = page.getByText(
      "Benchmark comparisons require a minimum number of peer institutions"
    );
    // Phase 1 info alert with role="alert"
    this.phase1Alert = page.locator('[role="alert"]').filter({ hasText: "Phase 1" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/benchmarks");
  }

  async hasInsufficientDataMessage(): Promise<boolean> {
    return this.insufficientDataHeading.isVisible();
  }

  async hasPhase1Alert(): Promise<boolean> {
    return this.phase1Alert.isVisible();
  }

  async getPhase1AlertText(): Promise<string> {
    await this.phase1Alert.waitFor({ state: "visible" });
    return this.phase1Alert.innerText();
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: "visible", timeout: 15000 });
  }
}
