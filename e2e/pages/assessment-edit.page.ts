import { type Page, type Locator } from "@playwright/test";

export class AssessmentEditPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly progressText: Locator;
  readonly progressBar: Locator;
  readonly saveStatusArea: Locator;
  readonly saveButton: Locator;
  readonly submitButton: Locator;
  readonly confirmDialog: Locator;
  readonly confirmDialogTitle: Locator;
  readonly confirmSubmitButton: Locator;
  readonly cancelSubmitButton: Locator;
  readonly themeSidebar: Locator;
  readonly themeButtons: Locator;
  readonly formContent: Locator;
  readonly backLink: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    // Page title: "Template Name - Academic Year"
    this.pageTitle = page.locator("h1.text-xl.font-bold");
    // Progress text: "N / M items (P%)"
    this.progressText = page.locator(".card").filter({ hasText: "Progress" }).locator("span.text-slate-600");
    // The progress bar fill
    this.progressBar = page.locator(".bg-brand-600.h-full.rounded-full");
    // Save status area containing "Saving...", "Saved", or "Save failed"
    this.saveStatusArea = page.locator("span.flex.items-center.gap-1\\.5");
    // Save button with Save icon
    this.saveButton = page.getByRole("button", { name: "Save" });
    // Submit button with Send icon
    this.submitButton = page.getByRole("button", { name: "Submit" });
    // ConfirmDialog elements
    this.confirmDialog = page.locator('[role="dialog"]');
    this.confirmDialogTitle = page.locator("#confirm-dialog-title");
    this.confirmSubmitButton = this.confirmDialog.getByRole("button", { name: "Submit Assessment" });
    this.cancelSubmitButton = this.confirmDialog.getByRole("button", { name: "Cancel" });
    // Theme sidebar nav (desktop version)
    this.themeSidebar = page.locator("nav.hidden.w-56");
    // Theme buttons inside sidebar
    this.themeButtons = this.themeSidebar.locator("button");
    // Form content area
    this.formContent = page.locator(".min-w-0.flex-1");
    this.backLink = page.getByRole("link", { name: "Back" });
    this.loadingSpinner = page.locator('[class*="animate-spin"]');
  }

  async goto(id: string): Promise<void> {
    await this.page.goto(`/assessments/${id}/edit`);
  }

  /**
   * Get the progress text like "5 / 52 items (10%)"
   */
  async getProgress(): Promise<string> {
    await this.progressText.waitFor({ state: "visible" });
    return this.progressText.innerText();
  }

  /**
   * Get the current save status text.
   * Returns "Saving...", "Saved", "Save failed", or empty string if idle.
   */
  async getSaveStatus(): Promise<string> {
    const text = await this.saveStatusArea.innerText();
    return text.trim();
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Confirm the submit action in the ConfirmDialog.
   */
  async confirmSubmit(): Promise<void> {
    await this.confirmDialog.waitFor({ state: "visible" });
    await this.confirmSubmitButton.click();
  }

  /**
   * Cancel the submit action in the ConfirmDialog.
   */
  async cancelSubmit(): Promise<void> {
    await this.confirmDialog.waitFor({ state: "visible" });
    await this.cancelSubmitButton.click();
  }

  /**
   * Select a theme in the sidebar by index (0-based).
   */
  async selectTheme(index: number): Promise<void> {
    await this.themeButtons.nth(index).click();
  }

  /**
   * Get the name of the currently active theme.
   */
  async getActiveThemeName(): Promise<string> {
    const activeButton = this.themeSidebar.locator("button.bg-brand-50");
    await activeButton.waitFor({ state: "visible" });
    const span = activeButton.locator("span").first();
    return span.innerText();
  }

  /**
   * Get the completion count text for a theme button at the given index.
   * Returns text like "3/10"
   */
  async getThemeCount(index: number): Promise<string> {
    const button = this.themeButtons.nth(index);
    // The count is in the second span (the one with ml-2 text-xs)
    const countSpan = button.locator("span.text-xs");
    return countSpan.innerText();
  }

  /**
   * Get the total number of themes in the sidebar.
   */
  async getThemeCount_total(): Promise<number> {
    return this.themeButtons.count();
  }

  async getTitle(): Promise<string> {
    await this.pageTitle.waitFor({ state: "visible" });
    return this.pageTitle.innerText();
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: "visible", timeout: 15000 });
  }
}
