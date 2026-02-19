import { type Page, type Locator } from "@playwright/test";

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  tenant_name: string;
  tenant_slug?: string;
  country: string;
}

export class RegisterPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly tenantNameInput: Locator;
  readonly tenantSlugInput: Locator;
  readonly countryInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fullNameInput = page.locator("#full_name");
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.tenantNameInput = page.locator("#tenant_name");
    this.tenantSlugInput = page.locator("#tenant_slug");
    this.countryInput = page.locator("#country");
    this.submitButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('[role="alert"]');
    this.loginLink = page.getByRole("link", { name: "Sign in" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/register");
  }

  async register(data: RegisterData): Promise<void> {
    await this.fullNameInput.fill(data.full_name);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.tenantNameInput.fill(data.tenant_name);
    // Slug is auto-generated from tenant_name, but allow override
    if (data.tenant_slug) {
      await this.tenantSlugInput.clear();
      await this.tenantSlugInput.fill(data.tenant_slug);
    }
    await this.countryInput.fill(data.country);
    await this.submitButton.click();
  }

  async getError(): Promise<string> {
    await this.errorAlert.waitFor({ state: "visible" });
    return this.errorAlert.innerText();
  }
}
