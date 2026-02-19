import { type Page, type Locator } from "@playwright/test";

export class AssessmentsListPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly newAssessmentLink: Locator;
  readonly assessmentTable: Locator;
  readonly tableRows: Locator;
  readonly emptyState: Locator;
  readonly loadingSpinner: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    // PageHeader renders an h1 with "Assessments"
    this.pageTitle = page.getByRole("heading", { level: 1, name: "Assessments" });
    // "New Assessment" link in the header actions area
    this.newAssessmentLink = page.getByRole("link", { name: "New Assessment" });
    // The assessment table
    this.assessmentTable = page.locator("table");
    // Table body rows (each row is an assessment)
    this.tableRows = page.locator("tbody tr");
    // EmptyState component shows "No assessments found"
    this.emptyState = page.getByText("No assessments found");
    this.loadingSpinner = page.locator('[class*="animate-spin"]');
    this.errorAlert = page.locator('[role="alert"]');
  }

  async goto(): Promise<void> {
    await this.page.goto("/assessments");
  }

  /**
   * Returns the number of assessment rows in the table.
   */
  async getAssessmentRows(): Promise<Locator> {
    return this.tableRows;
  }

  async getAssessmentCount(): Promise<number> {
    return this.tableRows.count();
  }

  async clickNew(): Promise<void> {
    await this.newAssessmentLink.click();
  }

  /**
   * Click the "Edit" link for an assessment row at the given index (0-based).
   */
  async clickEdit(index: number): Promise<void> {
    const row = this.tableRows.nth(index);
    const editLink = row.getByRole("link", { name: "Edit" });
    await editLink.click();
  }

  /**
   * Click the "View" link for an assessment row at the given index (0-based).
   */
  async clickView(index: number): Promise<void> {
    const row = this.tableRows.nth(index);
    const viewLink = row.getByRole("link", { name: "View" });
    await viewLink.click();
  }

  async getEmptyState(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  /**
   * Get the status badge text for a given row index.
   */
  async getRowStatus(index: number): Promise<string> {
    const row = this.tableRows.nth(index);
    // StatusBadge renders a Badge inside the second <td>
    const statusCell = row.locator("td").nth(1);
    return statusCell.innerText();
  }

  /**
   * Get the academic year for a given row index.
   */
  async getRowAcademicYear(index: number): Promise<string> {
    const row = this.tableRows.nth(index);
    const yearCell = row.locator("td").first();
    return yearCell.innerText();
  }

  async waitForLoad(): Promise<void> {
    await this.pageTitle.waitFor({ state: "visible", timeout: 15000 });
  }
}
