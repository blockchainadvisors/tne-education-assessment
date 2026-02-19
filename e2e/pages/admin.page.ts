import { type Page, type Locator } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cards: Locator;
  readonly institutionSettingsCard: Locator;
  readonly userManagementCard: Locator;
  readonly partnerInstitutionsCard: Locator;
  readonly systemConfigurationCard: Locator;
  readonly comingSoonButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    // PageHeader renders h1 "Administration"
    this.pageTitle = page.getByRole("heading", { level: 1, name: "Administration" });
    // All admin cards in the grid
    this.cards = page.locator(".card.flex.flex-col");
    // Individual cards identified by their h3 headings
    this.institutionSettingsCard = page.locator(".card").filter({
      hasText: "Institution Settings",
    });
    this.userManagementCard = page.locator(".card").filter({
      hasText: "User Management",
    });
    this.partnerInstitutionsCard = page.locator(".card").filter({
      hasText: "Partner Institutions",
    });
    this.systemConfigurationCard = page.locator(".card").filter({
      hasText: "System Configuration",
    });
    // All "Coming Soon" buttons (they are disabled)
    this.comingSoonButtons = page.getByRole("button", { name: "Coming Soon" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin");
  }

  /**
   * Get the titles of all admin cards.
   */
  async getCardTitles(): Promise<string[]> {
    const headings = this.page.locator(".card h3");
    const count = await headings.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await headings.nth(i).innerText();
      titles.push(text);
    }
    return titles;
  }

  /**
   * Check if all "Coming Soon" buttons are disabled.
   */
  async areCardsDisabled(): Promise<boolean> {
    const count = await this.comingSoonButtons.count();
    if (count === 0) return false;
    for (let i = 0; i < count; i++) {
      const isDisabled = await this.comingSoonButtons.nth(i).isDisabled();
      if (!isDisabled) return false;
    }
    return true;
  }

  /**
   * Get the number of admin cards displayed.
   */
  async getCardCount(): Promise<number> {
    return this.page.locator(".card h3").count();
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: "visible", timeout: 15000 });
  }
}
