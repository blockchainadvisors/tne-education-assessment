import { type Page, type Locator } from "@playwright/test";

export class SidebarPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly dashboardLink: Locator;
  readonly assessmentsLink: Locator;
  readonly benchmarksLink: Locator;
  readonly adminLink: Locator;
  readonly tenantName: Locator;
  readonly userMenuButton: Locator;
  readonly userMenuDropdown: Locator;
  readonly signOutButton: Locator;
  readonly userName: Locator;

  constructor(page: Page) {
    this.page = page;
    // The sidebar is an <aside> element with role="navigation" implied by nav,
    // or we select by the aside tag with bg-slate-900
    this.sidebar = page.locator("aside");
    this.dashboardLink = page.getByRole("link", { name: "Dashboard" }).first();
    this.assessmentsLink = page.getByRole("link", { name: "Assessments" }).first();
    this.benchmarksLink = page.getByRole("link", { name: "Benchmarks" }).first();
    this.adminLink = page.getByRole("link", { name: "Admin" }).first();
    // Tenant info is inside a bg-slate-800 div inside the sidebar
    this.tenantName = this.sidebar.locator(".bg-slate-800 .text-sm.font-semibold");
    // User menu button in the top bar (contains avatar and user name)
    this.userMenuButton = page.locator("header button").filter({ has: page.locator(".rounded-full") });
    // User menu dropdown appears when userMenuButton is clicked
    this.userMenuDropdown = page.locator(".absolute.right-0.z-20");
    // The user name shown in the user menu button area
    this.userName = page.locator("header button span.font-medium");
    // Sign out button inside the dropdown
    this.signOutButton = page.getByRole("button", { name: "Sign out" });
  }

  /**
   * Navigate to a section by clicking the corresponding sidebar link.
   * @param name - One of "Dashboard", "Assessments", "Benchmarks", or "Admin"
   */
  async navigateTo(name: "Dashboard" | "Assessments" | "Benchmarks" | "Admin"): Promise<void> {
    const links: Record<string, Locator> = {
      Dashboard: this.dashboardLink,
      Assessments: this.assessmentsLink,
      Benchmarks: this.benchmarksLink,
      Admin: this.adminLink,
    };
    const link = links[name];
    if (!link) {
      throw new Error(`Unknown navigation item: ${name}`);
    }
    await link.click();
  }

  async getTenantName(): Promise<string> {
    await this.tenantName.waitFor({ state: "visible" });
    return this.tenantName.innerText();
  }

  async getUserName(): Promise<string> {
    await this.userName.waitFor({ state: "visible" });
    return this.userName.innerText();
  }

  async openUserMenu(): Promise<void> {
    await this.userMenuButton.click();
    await this.userMenuDropdown.waitFor({ state: "visible" });
  }

  async signOut(): Promise<void> {
    await this.openUserMenu();
    await this.signOutButton.click();
  }
}
