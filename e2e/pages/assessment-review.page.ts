import { type Page, type Locator } from "@playwright/test";

export interface ThemeScore {
  themeName: string;
  percentage: string;
  rawScore: string;
}

export class AssessmentReviewPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly readOnlyNotice: Locator;
  readonly scoresSection: Locator;
  readonly overallScoreValue: Locator;
  readonly themeScoreCards: Locator;
  readonly themeSections: Locator;
  readonly backLink: Locator;
  readonly exportButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    // Page title: "Template Name - Academic Year"
    this.pageTitle = page.locator("h1.text-xl.font-bold");
    // Read-only notice text
    this.readOnlyNotice = page.getByText("Read-only review of submitted responses");
    // Scores section: card with "Assessment Scores" heading
    this.scoresSection = page.locator(".card").filter({ hasText: "Assessment Scores" });
    // Overall score: the large percentage value in the first score card
    this.overallScoreValue = this.scoresSection.locator("p.text-3xl.font-bold");
    // Individual theme score cards (after the overall score card)
    this.themeScoreCards = this.scoresSection.locator(".rounded-lg.bg-white.p-4.shadow-sm");
    // Theme sections: each card with items inside
    this.themeSections = page.locator(".card").filter({ has: page.locator("h2") });
    this.backLink = page.getByRole("link", { name: "Back to Assessments" });
    this.exportButton = page.getByRole("button", { name: "Export PDF" });
    this.loadingSpinner = page.locator('[class*="animate-spin"]');
  }

  async goto(id: string): Promise<void> {
    await this.page.goto(`/assessments/${id}/review`);
  }

  /**
   * Check if the scores section is visible (assessment has been scored).
   */
  async hasScores(): Promise<boolean> {
    return this.scoresSection.isVisible();
  }

  /**
   * Get the overall percentage score text (e.g., "72.5%").
   */
  async getOverallScore(): Promise<string> {
    await this.overallScoreValue.waitFor({ state: "visible" });
    return this.overallScoreValue.innerText();
  }

  /**
   * Get all theme scores from the scores summary section.
   */
  async getThemeScores(): Promise<ThemeScore[]> {
    const scores: ThemeScore[] = [];
    const count = await this.themeScoreCards.count();
    // Skip the first card (overall score), theme scores start from index 1
    for (let i = 1; i < count; i++) {
      const card = this.themeScoreCards.nth(i);
      const themeName = await card.locator("p.text-sm.text-slate-600").innerText();
      const percentage = await card.locator("p.text-2xl.font-bold").innerText();
      const rawScore = await card.locator("p.text-xs.text-slate-500").innerText();
      scores.push({ themeName, percentage, rawScore });
    }
    return scores;
  }

  /**
   * Get the response value for a specific item by its code (e.g., "TL01").
   * Returns the text content from the response area.
   */
  async getResponseValue(itemCode: string): Promise<string> {
    // Find the item container that has the item code text
    const itemContainer = this.page.locator(".rounded-lg.border.border-slate-200.p-4").filter({
      hasText: itemCode,
    });
    // The response value is in the bg-slate-50 div
    const responseArea = itemContainer.locator(".bg-slate-50");
    await responseArea.waitFor({ state: "visible" });
    return responseArea.innerText();
  }

  /**
   * Get the page title text.
   */
  async getTitle(): Promise<string> {
    await this.pageTitle.waitFor({ state: "visible" });
    return this.pageTitle.innerText();
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: "visible", timeout: 15000 });
  }
}
