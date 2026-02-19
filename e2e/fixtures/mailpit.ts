/**
 * Mailpit API helper — extracts verification tokens and magic-link tokens
 * from emails captured by Mailpit during E2E tests.
 *
 * Mailpit REST API: http://localhost:8025/api/v1/messages
 */

import { MAILPIT_URL } from "./test-data";

interface MailpitMessage {
  ID: string;
  MessageID: string;
  From: { Name: string; Address: string };
  To: { Name: string; Address: string }[];
  Subject: string;
  Snippet: string;
  Created: string;
}

interface MailpitMessageDetail {
  ID: string;
  HTML: string;
  Text: string;
  Subject: string;
}

interface MailpitListResponse {
  total: number;
  messages: MailpitMessage[];
}

export class MailpitClient {
  private baseUrl: string;

  constructor(baseUrl = MAILPIT_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * List messages, optionally filtered by recipient email.
   */
  async listMessages(
    recipientEmail?: string,
    limit = 50
  ): Promise<MailpitMessage[]> {
    let url = `${this.baseUrl}/api/v1/messages?limit=${limit}`;
    if (recipientEmail) {
      url = `${this.baseUrl}/api/v1/search?query=to:${encodeURIComponent(recipientEmail)}&limit=${limit}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mailpit list failed: ${response.status}`);
    }
    const data: MailpitListResponse = await response.json();
    return data.messages || [];
  }

  /**
   * Get a single message's full content (HTML + Text).
   */
  async getMessage(messageId: string): Promise<MailpitMessageDetail> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/message/${messageId}`
    );
    if (!response.ok) {
      throw new Error(`Mailpit get message failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Wait for an email to arrive for the given recipient.
   * Polls every 1s with a configurable timeout (default 15s).
   */
  async waitForEmail(
    recipientEmail: string,
    options: { timeout?: number; subjectContains?: string } = {}
  ): Promise<MailpitMessageDetail> {
    const { timeout = 15_000, subjectContains } = options;
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      const messages = await this.listMessages(recipientEmail);

      for (const msg of messages) {
        if (subjectContains && !msg.Subject.includes(subjectContains)) {
          continue;
        }
        return this.getMessage(msg.ID);
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    throw new Error(
      `No email for ${recipientEmail} within ${timeout}ms` +
        (subjectContains ? ` (subject containing "${subjectContains}")` : "")
    );
  }

  /**
   * Extract a verification token from an email's HTML body.
   * Looks for a URL parameter: ?token=<value>
   */
  extractToken(html: string): string | null {
    // Match verify-email?token=... or magic-link?token=...
    const match = html.match(/[?&]token=([a-zA-Z0-9._-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Convenience: wait for a verification email and extract the token.
   */
  async getVerificationToken(recipientEmail: string): Promise<string> {
    const msg = await this.waitForEmail(recipientEmail, {
      subjectContains: "Verify",
    });
    const token = this.extractToken(msg.HTML || msg.Text);
    if (!token) {
      throw new Error(
        `Could not extract verification token from email to ${recipientEmail}`
      );
    }
    return token;
  }

  /**
   * Convenience: wait for a magic-link email and extract the token.
   */
  async getMagicLinkToken(recipientEmail: string): Promise<string> {
    const msg = await this.waitForEmail(recipientEmail, {
      subjectContains: "Sign",
    });
    const token = this.extractToken(msg.HTML || msg.Text);
    if (!token) {
      throw new Error(
        `Could not extract magic link token from email to ${recipientEmail}`
      );
    }
    return token;
  }

  /**
   * Delete all messages (useful between test runs).
   */
  async deleteAll(): Promise<void> {
    await fetch(`${this.baseUrl}/api/v1/messages`, { method: "DELETE" });
  }

  /**
   * Delete messages for a specific recipient.
   */
  async deleteForRecipient(recipientEmail: string): Promise<void> {
    const messages = await this.listMessages(recipientEmail);
    for (const msg of messages) {
      await fetch(`${this.baseUrl}/api/v1/messages`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ IDs: [msg.ID] }),
      });
    }
  }
}

export const mailpit = new MailpitClient();
