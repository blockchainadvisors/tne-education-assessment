import { type Page, type Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly statusCardsContainer: Locator;
  readonly emptyState: Locator;
  readonly newAssessmentLink: Locator;
  readonly scoreOverviewSection: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    // PageHeader renders an h1 with "Welcome back" text
    this.welcomeHeading = page.getByRole("heading", { level: 1 }).filter({ hasText: "Welcome back" });
    // Status cards grid container
    this.statusCardsContainer = page.locator(".grid.gap-4");
    // EmptyState renders h3 "No assessments yet" inside a card
    this.emptyState = page.getByText("No assessments yet");
    // "Create your first assessment" link inside the empty state
    this.newAssessmentLink = page.getByRole("link", { name: "Create your first assessment" });
    // Score overview section with "Latest Assessment Score" heading
    this.scoreOverviewSection = page.getByText("Latest Assessment Score");
    this.loadingSpinner = page.locator('[class*="animate-spin"]');
  }

  async goto(): Promise<void> {
    await this.page.goto("/dashboard");
  }

  async getWelcomeText(): Promise<string> {
    await this.welcomeHeading.waitFor({ state: "visible" });
    return this.welcomeHeading.innerText();
  }

  /**
   * Get the count displayed for a given status card.
   * @param status - One of "Draft", "In Progress", "Submitted", or "Scored"
   */
  async getStatusCount(status: "Draft" | "In Progress" | "Submitted" | "Scored"): Promise<number> {
    // Each status card has a p with the label text and a sibling p with the count
    const card = this.statusCardsContainer.locator("div.rounded-xl").filter({
      hasText: status,
    });
    const countText = await card.locator("p.text-2xl").innerText();
    return parseInt(countText, 10);
  }

  async hasEmptyState(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async clickNewAssessment(): Promise<void> {
    await this.newAssessmentLink.click();
  }

  async waitForLoad(): Promise<void> {
    // Wait for the welcome heading to appear (indicates data has loaded)
    await this.welcomeHeading.waitFor({ state: "visible", timeout: 15000 });
  }
}
