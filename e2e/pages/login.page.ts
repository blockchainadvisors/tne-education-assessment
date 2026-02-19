import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly magicEmailInput: Locator;
  readonly passwordTab: Locator;
  readonly magicLinkTab: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly successAlert: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator("#email");
    this.passwordInput = page.locator("#password");
    this.magicEmailInput = page.locator("#magic-email");
    this.passwordTab = page.getByRole("button", { name: "Password" });
    this.magicLinkTab = page.getByRole("button", { name: "Magic Link" });
    this.submitButton = page.locator('button[type="submit"]');
    this.errorAlert = page.locator('[role="alert"]').filter({ hasText: /.+/ }).first();
    this.successAlert = page.locator('[role="alert"]').filter({ hasText: /.+/ }).first();
    this.registerLink = page.getByRole("link", { name: "Register your institution" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async loginWithPassword(email: string, password: string): Promise<void> {
    await this.switchToTab("password");
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async requestMagicLink(email: string): Promise<void> {
    await this.switchToTab("magic-link");
    await this.magicEmailInput.fill(email);
    await this.submitButton.click();
  }

  async switchToTab(tab: "password" | "magic-link"): Promise<void> {
    if (tab === "password") {
      await this.passwordTab.click();
    } else {
      await this.magicLinkTab.click();
    }
  }

  async getError(): Promise<string> {
    const alert = this.page.locator('[role="alert"]').first();
    await alert.waitFor({ state: "visible" });
    return alert.innerText();
  }

  async getMessage(): Promise<string> {
    const alert = this.page.locator('[role="alert"]').first();
    await alert.waitFor({ state: "visible" });
    return alert.innerText();
  }
}
