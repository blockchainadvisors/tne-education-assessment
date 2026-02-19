import { type Page, type Locator } from "@playwright/test";

export class AssessmentNewPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly templateSelect: Locator;
  readonly academicYearInput: Locator;
  readonly submitButton: Locator;
  readonly cancelLink: Locator;
  readonly errorAlert: Locator;
  readonly templateDetails: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Create New Assessment" });
    this.templateSelect = page.locator("#template");
    this.academicYearInput = page.locator("#academicYear");
    // The submit button contains "Create Assessment" text
    this.submitButton = page.getByRole("button", { name: "Create Assessment" });
    this.cancelLink = page.getByRole("link", { name: "Cancel" });
    this.errorAlert = page.locator('[role="alert"]');
    // Template details panel appears when a template is selected
    this.templateDetails = page.locator(".bg-brand-50");
    this.backLink = page.getByRole("link", { name: "Back to Assessments" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/assessments/new");
  }

  /**
   * Select a template by its visible text label.
   * @param name - The template name as it appears in the select dropdown
   */
  async selectTemplate(name: string): Promise<void> {
    await this.templateSelect.selectOption({ label: name });
  }

  /**
   * Select a template by its option value (template ID).
   * @param value - The template ID
   */
  async selectTemplateByValue(value: string): Promise<void> {
    await this.templateSelect.selectOption({ value });
  }

  async setAcademicYear(year: string): Promise<void> {
    await this.academicYearInput.fill(year);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async getError(): Promise<string> {
    await this.errorAlert.waitFor({ state: "visible" });
    return this.errorAlert.innerText();
  }

  async isTemplateDetailsVisible(): Promise<boolean> {
    return this.templateDetails.isVisible();
  }

  async getTemplateOptions(): Promise<string[]> {
    const options = this.templateSelect.locator("option");
    const count = await options.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).innerText();
      texts.push(text);
    }
    return texts;
  }

  async waitForLoad(): Promise<void> {
    await this.heading.waitFor({ state: "visible", timeout: 15000 });
  }
}
