import { type Page, type Locator } from "@playwright/test";

export class VerifyEmailPage {
  readonly page: Page;
  readonly successHeading: Locator;
  readonly errorHeading: Locator;
  readonly verifyingHeading: Locator;
  readonly checkEmailHeading: Locator;
  readonly resendButton: Locator;
  readonly successAlert: Locator;
  readonly errorAlert: Locator;
  readonly backToSignInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    // Verify email page elements
    this.successHeading = page.getByRole("heading", { name: "Email verified!" });
    this.errorHeading = page.getByRole("heading", { name: "Verification failed" });
    this.verifyingHeading = page.getByRole("heading", { name: "Verifying your email..." });
    // Verify email sent page elements
    this.checkEmailHeading = page.getByRole("heading", { name: "Check your email" });
    this.resendButton = page.getByRole("button", { name: "Resend verification email" });
    this.successAlert = page.locator('[role="alert"]').first();
    this.errorAlert = page.locator('[role="alert"]').first();
    this.backToSignInLink = page.getByRole("link", { name: "Back to sign in" });
  }

  async gotoVerify(token: string): Promise<void> {
    await this.page.goto(`/verify-email?token=${encodeURIComponent(token)}`);
  }

  async gotoSent(email: string): Promise<void> {
    await this.page.goto(`/verify-email-sent?email=${encodeURIComponent(email)}`);
  }

  async waitForSuccess(): Promise<void> {
    await this.successHeading.waitFor({ state: "visible", timeout: 15000 });
  }

  async waitForError(): Promise<void> {
    await this.errorHeading.waitFor({ state: "visible", timeout: 15000 });
  }

  async resendVerification(): Promise<void> {
    await this.resendButton.click();
  }

  async getResendMessage(): Promise<string> {
    const alert = this.page.locator('[role="alert"]').first();
    await alert.waitFor({ state: "visible" });
    return alert.innerText();
  }
}
