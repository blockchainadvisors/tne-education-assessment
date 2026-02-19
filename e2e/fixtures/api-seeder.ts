/**
 * Direct HTTP client for seeding data and querying the API in tests.
 * Bypasses the UI for setup/teardown operations.
 */

import { API_URL, USERS, type UserKey } from "./test-data";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

export class ApiSeeder {
  private baseUrl: string;
  private tokenCache = new Map<string, string>();

  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl;
  }

  // -------------------------------------------------------------------------
  // HTTP helpers
  // -------------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      token?: string;
      expectStatus?: number;
    } = {}
  ): Promise<T> {
    const { body, token, expectStatus } = options;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (expectStatus && response.status !== expectStatus) {
      const text = await response.text();
      throw new Error(
        `Expected ${expectStatus} but got ${response.status} for ${method} ${path}: ${text}`
      );
    }

    if (!response.ok && !expectStatus) {
      const text = await response.text();
      throw new Error(
        `${method} ${path} failed with ${response.status}: ${text}`
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  // -------------------------------------------------------------------------
  // Auth
  // -------------------------------------------------------------------------

  async login(email: string, password: string): Promise<TokenPair> {
    return this.request<TokenPair>("POST", "/auth/login", {
      body: { email, password },
    });
  }

  async getToken(userKey: UserKey): Promise<string> {
    const cached = this.tokenCache.get(userKey);
    if (cached) return cached;

    const user = USERS[userKey];
    const tokens = await this.login(user.email, user.password);
    this.tokenCache.set(userKey, tokens.access_token);
    return tokens.access_token;
  }

  clearTokenCache(): void {
    this.tokenCache.clear();
  }

  // -------------------------------------------------------------------------
  // Assessments
  // -------------------------------------------------------------------------

  async getTemplates(token: string): Promise<{ id: string; name: string }[]> {
    return this.request("GET", "/assessments/templates", { token });
  }

  async createAssessment(
    token: string,
    templateId: string,
    academicYear: string
  ): Promise<{ id: string; status: string }> {
    return this.request("POST", "/assessments", {
      token,
      body: { template_id: templateId, academic_year: academicYear },
    });
  }

  async getAssessment(
    token: string,
    assessmentId: string
  ): Promise<{ id: string; status: string; overall_score: number | null }> {
    return this.request("GET", `/assessments/${assessmentId}`, { token });
  }

  async listAssessments(
    token: string
  ): Promise<{ id: string; status: string; academic_year: string }[]> {
    return this.request("GET", "/assessments", { token });
  }

  async submitAssessment(
    token: string,
    assessmentId: string
  ): Promise<{ id: string; status: string }> {
    return this.request("POST", `/assessments/${assessmentId}/submit`, {
      token,
    });
  }

  async changeAssessmentStatus(
    token: string,
    assessmentId: string,
    newStatus: string
  ): Promise<{ id: string; status: string }> {
    return this.request(
      "POST",
      `/assessments/${assessmentId}/status/${newStatus}`,
      { token }
    );
  }

  // -------------------------------------------------------------------------
  // Responses
  // -------------------------------------------------------------------------

  async saveResponses(
    token: string,
    assessmentId: string,
    responses: { item_id: string; value: unknown; partner_id?: string }[]
  ): Promise<unknown[]> {
    return this.request(
      "PUT",
      `/assessments/${assessmentId}/responses`,
      { token, body: { responses } }
    );
  }

  async getResponses(
    token: string,
    assessmentId: string
  ): Promise<{ id: string; item_id: string; value: unknown }[]> {
    return this.request("GET", `/assessments/${assessmentId}/responses`, {
      token,
    });
  }

  // -------------------------------------------------------------------------
  // Scoring & Reports
  // -------------------------------------------------------------------------

  async triggerScoring(
    token: string,
    assessmentId: string
  ): Promise<{ id: string; status: string }> {
    return this.request(
      "POST",
      `/assessments/${assessmentId}/scores/trigger-scoring`,
      { token }
    );
  }

  async getScores(
    token: string,
    assessmentId: string
  ): Promise<{
    assessment_id: string;
    overall_score: number | null;
    theme_scores: unknown[];
  }> {
    return this.request("GET", `/assessments/${assessmentId}/scores`, {
      token,
    });
  }

  async triggerReport(
    token: string,
    assessmentId: string
  ): Promise<{ id: string; status: string }> {
    return this.request(
      "POST",
      `/assessments/${assessmentId}/report/generate`,
      { token }
    );
  }

  async getReport(
    token: string,
    assessmentId: string
  ): Promise<unknown> {
    return this.request("GET", `/assessments/${assessmentId}/report`, {
      token,
    });
  }

  // -------------------------------------------------------------------------
  // Jobs
  // -------------------------------------------------------------------------

  async getJobStatus(
    token: string,
    jobId: string
  ): Promise<{ id: string; status: string; error_message: string | null }> {
    return this.request("GET", `/jobs/${jobId}`, { token });
  }

  // -------------------------------------------------------------------------
  // Files
  // -------------------------------------------------------------------------

  async listFiles(
    token: string,
    assessmentId: string
  ): Promise<{ id: string; original_filename: string }[]> {
    return this.request("GET", `/assessments/${assessmentId}/files`, {
      token,
    });
  }

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------

  async getAdminStats(
    token: string
  ): Promise<{
    total_tenants: number;
    total_users: number;
    total_assessments: number;
  }> {
    return this.request("GET", "/admin/stats", { token });
  }

  async listAllTenants(token: string): Promise<{ id: string; name: string }[]> {
    return this.request("GET", "/admin/tenants", { token });
  }

  // -------------------------------------------------------------------------
  // Tenants & Partners
  // -------------------------------------------------------------------------

  async getCurrentTenant(
    token: string
  ): Promise<{ id: string; name: string; slug: string }> {
    return this.request("GET", "/tenants/current", { token });
  }

  async updateCurrentTenant(
    token: string,
    data: Record<string, unknown>
  ): Promise<{ id: string; name: string }> {
    return this.request("PUT", "/tenants/current", { token, body: data });
  }

  async listPartners(
    token: string
  ): Promise<{ id: string; name: string; country: string }[]> {
    return this.request("GET", "/tenants/current/partners", { token });
  }

  async createPartner(
    token: string,
    data: { name: string; country: string; position?: number }
  ): Promise<{ id: string; name: string }> {
    return this.request("POST", "/tenants/current/partners", {
      token,
      body: data,
    });
  }

  async deletePartner(token: string, partnerId: string): Promise<void> {
    return this.request("DELETE", `/tenants/current/partners/${partnerId}`, {
      token,
    });
  }

  // -------------------------------------------------------------------------
  // Users
  // -------------------------------------------------------------------------

  async listUsers(
    token: string
  ): Promise<{ id: string; email: string; role: string }[]> {
    return this.request("GET", "/users", { token });
  }

  async createUser(
    token: string,
    data: { email: string; password: string; full_name: string; role: string }
  ): Promise<{ id: string; email: string; role: string }> {
    return this.request("POST", "/users", { token, body: data });
  }

  async updateUser(
    token: string,
    userId: string,
    data: Record<string, unknown>
  ): Promise<{ id: string; email: string; role: string }> {
    return this.request("PUT", `/users/${userId}`, { token, body: data });
  }

  async getMe(token: string): Promise<{ id: string; email: string; role: string }> {
    return this.request("GET", "/users/me", { token });
  }

  // -------------------------------------------------------------------------
  // Benchmarks
  // -------------------------------------------------------------------------

  async getBenchmarkComparison(
    token: string,
    assessmentId: string
  ): Promise<unknown> {
    return this.request("GET", `/benchmarks/compare/${assessmentId}`, {
      token,
    });
  }

  // -------------------------------------------------------------------------
  // Raw request (for error testing)
  // -------------------------------------------------------------------------

  async rawRequest(
    method: string,
    path: string,
    options: {
      body?: unknown;
      token?: string;
    } = {}
  ): Promise<{ status: number; body: unknown }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (options.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return { status: response.status, body };
  }
}

export const api = new ApiSeeder();
